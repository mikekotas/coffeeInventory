import { defineStore, acceptHMRUpdate } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from './authStore'
import { LS_KEYS } from '@/lib/constants'
import type { Shift } from '@/types'

export const useReceiverShiftsStore = defineStore('receiverShifts', () => {
  const currentShift = ref<Shift | null>(null)
  const shifts = ref<Shift[]>([])
  const loading = ref(false)

  const hasActiveShift = computed(() => currentShift.value !== null && currentShift.value.is_active)
  const shiftDuration = computed(() => {
    if (!currentShift.value) return null
    const start = new Date(currentShift.value.started_at)
    const end = currentShift.value.ended_at ? new Date(currentShift.value.ended_at) : new Date()
    const diff = end.getTime() - start.getTime()
    const hours = Math.floor(diff / 3600000)
    const minutes = Math.floor((diff % 3600000) / 60000)
    return `${hours}h ${minutes}m`
  })

  async function initialize() {
    const savedShiftId = localStorage.getItem(LS_KEYS.receiverShiftId)
    if (savedShiftId) {
      await fetchShiftById(savedShiftId)
      if (currentShift.value && !currentShift.value.is_active) {
        currentShift.value = null
        localStorage.removeItem(LS_KEYS.receiverShiftId)
      }
    }
  }

  async function fetchShiftById(shiftId: string) {
    const { data, error } = await supabase
      .from('shifts')
      .select('*, profile:profiles(id, full_name)')
      .eq('id', shiftId)
      .single()
    if (error) throw error
    currentShift.value = data as Shift
  }

  async function startShift(notes?: string) {
    const authStore = useAuthStore()
    if (!authStore.profile) throw new Error('Not authenticated')

    const { data, error } = await supabase
      .from('shifts')
      .insert({
        staff_id: authStore.profile.id,
        notes: notes ?? null,
        is_active: true,
      })
      .select('*, profile:profiles(id, full_name)')
      .single()

    if (error) throw error
    currentShift.value = data as Shift
    localStorage.setItem(LS_KEYS.receiverShiftId, data.id)
    return data as Shift
  }

  async function endShift(notes?: string) {
    if (!currentShift.value) throw new Error('No active shift')
    const authStore = useAuthStore()

    const { data: salesData } = await supabase
      .from('sales')
      .select('total_amount')
      .eq('shift_id', currentShift.value.id)

    const totalRevenueNum = salesData?.reduce((sum, s) => sum + s.total_amount, 0) ?? 0

    const { data, error } = await supabase
      .from('shifts')
      .update({
        is_active: false,
        ended_at: new Date().toISOString(),
        notes: notes ?? currentShift.value.notes,
      })
      .eq('id', currentShift.value.id)
      .select('*, profile:profiles(id, full_name)')
      .single()

    if (error) throw error

    await supabase.from('notifications').insert({
      message: `Receiver shift closed by ${data.profile?.full_name ?? authStore.profile?.full_name}. Total Revenue: €${totalRevenueNum.toFixed(2)}`,
      severity: 'warning',
      status: 'unread',
    })

    currentShift.value = data as Shift
    localStorage.removeItem(LS_KEYS.receiverShiftId)
  }

  async function fetchAll(staffId?: string) {
    loading.value = true
    try {
      let query = supabase
        .from('shifts')
        .select('*, profile:profiles(id, full_name)')
        .order('started_at', { ascending: false })
        .limit(50)

      if (staffId) query = query.eq('staff_id', staffId)

      const { data, error } = await query
      if (error) throw error
      shifts.value = (data ?? []) as Shift[]
    } finally {
      loading.value = false
    }
  }

  // Returns all currently active shifts across all users
  // Used by Queue.vue to display the "who's working" strip
  async function fetchAllActive(): Promise<Shift[]> {
    const { data, error } = await supabase
      .from('shifts')
      .select('*, profile:profiles(id, full_name)')
      .eq('is_active', true)
      .order('started_at', { ascending: false })
    if (error) throw error
    return (data ?? []) as Shift[]
  }

  return {
    currentShift,
    shifts,
    loading,
    hasActiveShift,
    shiftDuration,
    initialize,
    fetchShiftById,
    startShift,
    endShift,
    fetchAll,
    fetchAllActive,
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useReceiverShiftsStore, import.meta.hot))
}
