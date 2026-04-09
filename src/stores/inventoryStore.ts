import { defineStore, acceptHMRUpdate } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'
import type { InventoryItem, InventoryItemForm, InventoryCategory } from '@/types'
import { getStockStatus } from '@/types'

export const useInventoryStore = defineStore('inventory', () => {
  const items = ref<InventoryItem[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const realStuff = computed(() => items.value.filter(i => i.category === 'real_stuff' && i.is_active))
  const peripherals = computed(() => items.value.filter(i => i.category === 'peripherals' && i.is_active))
  const lowStockItems = computed(() => items.value.filter(i => {
    const status = getStockStatus(i)
    return status === 'warning' || status === 'critical' || status === 'out'
  }))
  const criticalItems = computed(() => items.value.filter(i => getStockStatus(i) === 'critical' || getStockStatus(i) === 'out'))

  async function fetchAll() {
    loading.value = true
    error.value = null
    try {
      const { data, error: err } = await supabase
        .from('inventory')
        .select('*')
        .order('category')
        .order('name')

      if (err) throw err
      items.value = data ?? []
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch inventory'
    } finally {
      loading.value = false
    }
  }

  async function fetchByCategory(category: InventoryCategory): Promise<InventoryItem[]> {
    const { data, error: err } = await supabase
      .from('inventory')
      .select('*')
      .eq('category', category)
      .eq('is_active', true)
      .order('name')
    if (err) throw err
    return data ?? []
  }

  async function create(form: InventoryItemForm): Promise<InventoryItem> {
    const { data, error: err } = await supabase
      .from('inventory')
      .insert(form)
      .select()
      .single()
    if (err) throw err
    items.value.push(data)
    return data
  }

  async function update(id: string, form: Partial<InventoryItemForm>): Promise<InventoryItem> {
    const { data, error: err } = await supabase
      .from('inventory')
      .update(form)
      .eq('id', id)
      .select()
      .single()
    if (err) throw err
    const idx = items.value.findIndex(i => i.id === id)
    if (idx !== -1) items.value[idx] = data
    return data
  }

  async function updateStock(id: string, newQty: number): Promise<void> {
    const { data, error: err } = await supabase
      .from('inventory')
      .update({ stock_qty: newQty })
      .eq('id', id)
      .select()
      .single()
    if (err) throw err
    const idx = items.value.findIndex(i => i.id === id)
    if (idx !== -1) items.value[idx] = data
  }

  async function remove(id: string): Promise<void> {
    // Soft delete: set is_active = false
    const { error: err } = await supabase
      .from('inventory')
      .update({ is_active: false })
      .eq('id', id)
    if (err) throw err
    const idx = items.value.findIndex(i => i.id === id)
    if (idx !== -1) items.value[idx].is_active = false
  }

  async function hardDelete(id: string): Promise<void> {
    const { error: err } = await supabase.from('inventory').delete().eq('id', id)
    if (err) throw err
    items.value = items.value.filter(i => i.id !== id)
  }

  // Subscribe to realtime changes
  function subscribeRealtime() {
    const channel = supabase
      .channel('inventory-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'inventory' }, (payload) => {
        if (payload.eventType === 'UPDATE') {
          const updated = payload.new as InventoryItem
          const idx = items.value.findIndex(i => i.id === updated.id)
          if (idx !== -1) items.value[idx] = updated
        } else if (payload.eventType === 'INSERT') {
          items.value.push(payload.new as InventoryItem)
        } else if (payload.eventType === 'DELETE') {
          items.value = items.value.filter(i => i.id !== (payload.old as InventoryItem).id)
        }
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }

  return {
    items,
    loading,
    error,
    realStuff,
    peripherals,
    lowStockItems,
    criticalItems,
    fetchAll,
    fetchByCategory,
    create,
    update,
    updateStock,
    remove,
    hardDelete,
    subscribeRealtime,
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useInventoryStore, import.meta.hot))
}
