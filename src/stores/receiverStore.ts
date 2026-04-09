import { defineStore, acceptHMRUpdate } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'
import type { Sale } from '@/types'

const SALE_SELECT = `
  *,
  profile:profiles(id, full_name),
  shift:shifts(id, started_at),
  sale_items(*, product:products(*))
`

export const useReceiverStore = defineStore('receiver', () => {
  const pendingQueue = ref<Sale[]>([])
  const recentCompleted = ref<Sale[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const completing = ref<string | null>(null)

  const pendingCount = computed(() => pendingQueue.value.length)

  async function fetchQueue() {
    loading.value = true
    error.value = null
    try {
      // Pending orders: completed_at IS NULL, oldest first (FIFO)
      const { data: pending, error: pendingErr } = await supabase
        .from('sales')
        .select(SALE_SELECT)
        .is('completed_at', null)
        .order('created_at', { ascending: true })

      if (pendingErr) throw pendingErr
      pendingQueue.value = (pending ?? []) as Sale[]

      // Recent completed: last 10, newest first
      const { data: completed, error: completedErr } = await supabase
        .from('sales')
        .select(SALE_SELECT)
        .not('completed_at', 'is', null)
        .order('completed_at', { ascending: false })
        .limit(10)

      if (completedErr) throw completedErr
      recentCompleted.value = (completed ?? []) as Sale[]
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Failed to load queue'
    } finally {
      loading.value = false
    }
  }

  async function markComplete(saleId: string) {
    completing.value = saleId
    try {
      const now = new Date().toISOString()
      const { error: err } = await supabase
        .from('sales')
        .update({ completed_at: now })
        .eq('id', saleId)

      if (err) throw err

      // Optimistic update: move from pending to completed immediately
      const idx = pendingQueue.value.findIndex(s => s.id === saleId)
      if (idx !== -1) {
        const sale = { ...pendingQueue.value[idx], completed_at: now }
        pendingQueue.value.splice(idx, 1)
        recentCompleted.value.unshift(sale as Sale)
        if (recentCompleted.value.length > 10) recentCompleted.value.pop()
      }
    } finally {
      completing.value = null
    }
  }

  function subscribeRealtime(): () => void {
    const channel = supabase
      .channel('sales-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'sales' },
        async (payload) => {
          // Fetch the full sale with joins — raw payload lacks relations
          const { data } = await supabase
            .from('sales')
            .select(SALE_SELECT)
            .eq('id', payload.new.id)
            .single()
          if (data) {
            pendingQueue.value.push(data as Sale)
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'sales' },
        async (payload) => {
          const updatedId = payload.new.id as string

          // If completed_at was just set, move from pending to completed
          if (payload.new.completed_at && !payload.old.completed_at) {
            const idx = pendingQueue.value.findIndex(s => s.id === updatedId)
            if (idx !== -1) {
              const sale = { ...pendingQueue.value[idx], completed_at: payload.new.completed_at }
              pendingQueue.value.splice(idx, 1)
              recentCompleted.value.unshift(sale as Sale)
              if (recentCompleted.value.length > 10) recentCompleted.value.pop()
            }
          }
        }
      )
      .subscribe()

    return () => supabase.removeChannel(channel)
  }

  return {
    pendingQueue,
    recentCompleted,
    loading,
    error,
    completing,
    pendingCount,
    fetchQueue,
    markComplete,
    subscribeRealtime,
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useReceiverStore, import.meta.hot))
}
