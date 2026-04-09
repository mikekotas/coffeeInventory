import { defineStore, acceptHMRUpdate } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from './authStore'
import type { Order, OrderItem } from '@/types'

export const useOrdersStore = defineStore('orders', () => {
  const orders = ref<Order[]>([])
  const draftOrder = ref<Order | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const draftItems = computed(() => draftOrder.value?.order_items ?? [])
  const draftItemCount = computed(() => draftItems.value.length)

  async function fetchAll() {
    loading.value = true
    try {
      const { data, error: err } = await supabase
        .from('orders')
        .select(`
          *,
          creator:profiles!created_by(id, full_name),
          order_items(*, inventory:inventory(*))
        `)
        .order('created_at', { ascending: false })
      if (err) throw err
      orders.value = (data ?? []) as Order[]
    } finally {
      loading.value = false
    }
  }

  async function fetchDraftOrder() {
    const { data, error: err } = await supabase
      .from('orders')
      .select(`
        *,
        creator:profiles!created_by(id, full_name),
        order_items(*, inventory:inventory(*))
      `)
      .eq('status', 'draft')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (err) throw err
    draftOrder.value = data as Order | null
  }

  async function ensureDraftOrder(): Promise<Order> {
    if (draftOrder.value) return draftOrder.value

    // First, check the DB for an existing draft (in case fetchDraftOrder wasn't called)
    const { data: existing, error: fetchErr } = await supabase
      .from('orders')
      .select(`*, creator:profiles!created_by(id, full_name), order_items(*, inventory:inventory(*))`)
      .eq('status', 'draft')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (fetchErr) throw fetchErr

    if (existing) {
      draftOrder.value = existing as Order
      return existing as Order
    }

    // No existing draft — create one
    const authStore = useAuthStore()
    const userId = authStore.profile?.id
    if (!userId) throw new Error('Not authenticated — profile not loaded')

    const { data, error: err } = await supabase
      .from('orders')
      .insert({ created_by: userId, status: 'draft' })
      .select(`*, creator:profiles!created_by(id, full_name), order_items(*, inventory:inventory(*))`)
      .single()

    if (err) throw err
    draftOrder.value = data as Order
    return data as Order
  }

  async function addItem(inventoryId: string, quantity = 1, notes?: string) {
    const order = await ensureDraftOrder()

    // Check if item already in draft order
    const existing = order.order_items?.find(i => i.inventory_id === inventoryId)
    if (existing) {
      // Update quantity
      const { data, error: err } = await supabase
        .from('order_items')
        .update({ quantity_requested: existing.quantity_requested + quantity })
        .eq('id', existing.id)
        .select('*, inventory:inventory(*)')
        .single()
      if (err) throw err
      if (draftOrder.value?.order_items) {
        const idx = draftOrder.value.order_items.findIndex(i => i.id === existing.id)
        if (idx !== -1) draftOrder.value.order_items[idx] = data as OrderItem
      }
      return
    }

    const { data, error: err } = await supabase
      .from('order_items')
      .insert({
        order_id: order.id,
        inventory_id: inventoryId,
        quantity_requested: quantity,
        source: 'manual',
        notes: notes ?? null,
      })
      .select('*, inventory:inventory(*)')
      .single()

    if (err) throw err
    if (!draftOrder.value!.order_items) draftOrder.value!.order_items = []
    draftOrder.value!.order_items.push(data as OrderItem)
  }

  async function removeItem(orderItemId: string) {
    const { error: err } = await supabase.from('order_items').delete().eq('id', orderItemId)
    if (err) throw err
    if (draftOrder.value?.order_items) {
      draftOrder.value.order_items = draftOrder.value.order_items.filter(i => i.id !== orderItemId)
    }
    for (const order of orders.value) {
      if (order.order_items) {
        order.order_items = order.order_items.filter(i => i.id !== orderItemId)
      }
    }
  }

  async function updateItemQty(orderItemId: string, qty: number) {
    const { data, error: err } = await supabase
      .from('order_items')
      .update({ quantity_requested: qty })
      .eq('id', orderItemId)
      .select('*, inventory:inventory(*)')
      .single()
    if (err) throw err
    if (draftOrder.value?.order_items) {
      const idx = draftOrder.value.order_items.findIndex(i => i.id === orderItemId)
      if (idx !== -1) draftOrder.value.order_items[idx] = data as OrderItem
    }
    for (const order of orders.value) {
      if (order.order_items) {
        const idx = order.order_items.findIndex(i => i.id === orderItemId)
        if (idx !== -1) { order.order_items[idx] = data as OrderItem; break }
      }
    }
  }

  async function finalizeOrder(orderId: string) {
    const authStore = useAuthStore()
    const { error: err } = await supabase
      .from('orders')
      .update({
        status: 'finalized',
        finalized_at: new Date().toISOString(),
        finalized_by: authStore.profile!.id,
      })
      .eq('id', orderId)
      .eq('status', 'draft')
    if (err) throw err
    await fetchAll()
    if (draftOrder.value?.id === orderId) {
      draftOrder.value = null
    }
  }

  // Subscribe to realtime order changes
  function subscribeRealtime() {
    const channel = supabase
      .channel('orders-changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'order_items' }, () => {
        fetchDraftOrder()
      })
      .subscribe()
    return () => supabase.removeChannel(channel)
  }

  return {
    orders,
    draftOrder,
    draftItems,
    draftItemCount,
    loading,
    error,
    fetchAll,
    fetchDraftOrder,
    addItem,
    removeItem,
    updateItemQty,
    finalizeOrder,
    subscribeRealtime,
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useOrdersStore, import.meta.hot))
}
