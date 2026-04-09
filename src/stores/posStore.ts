import { defineStore, acceptHMRUpdate } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from './authStore'
import { useShiftsStore } from './shiftsStore'
import type { Product, CartItem } from '@/types'

export const usePosStore = defineStore('pos', () => {
  const cart = ref<CartItem[]>([])
  const products = ref<Product[]>([])
  const loading = ref(false)
  const submitting = ref(false)
  const error = ref<string | null>(null)
  const lastSaleId = ref<string | null>(null)
  const saleType = ref<'takeaway' | 'table'>('takeaway')
  const tableIdentifier = ref<string>('')
  const paymentMethod = ref<'cash' | 'card'>('cash')

  const cartTotal = computed(() =>
    cart.value.reduce((sum, item) => sum + item.product.base_price * item.qty, 0)
  )
  const cartItemCount = computed(() =>
    cart.value.reduce((sum, item) => sum + item.qty, 0)
  )
  const isEmpty = computed(() => cart.value.length === 0)

  async function fetchProducts() {
    loading.value = true
    try {
      const { data, error: err } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('category')
        .order('name')
      if (err) throw err
      products.value = data ?? []
    } finally {
      loading.value = false
    }
  }

  function addToCart(product: Product, qty = 1) {
    const existing = cart.value.find(i => i.product.id === product.id)
    if (existing) {
      existing.qty += qty
    } else {
      cart.value.push({ product, qty })
    }
  }

  function removeFromCart(productId: string) {
    cart.value = cart.value.filter(i => i.product.id !== productId)
  }

  function updateQty(productId: string, qty: number) {
    if (qty <= 0) {
      removeFromCart(productId)
      return
    }
    const item = cart.value.find(i => i.product.id === productId)
    if (item) item.qty = qty
  }

  function clearCart() {
    cart.value = []
    saleType.value = 'takeaway'
    tableIdentifier.value = ''
    paymentMethod.value = 'cash'
  }

  async function confirmSale(shiftIdOverride?: string | null): Promise<string> {
    if (cart.value.length === 0) throw new Error('Cart is empty')

    const authStore = useAuthStore()
    const shiftsStore = useShiftsStore()

    if (!authStore.profile) throw new Error('Not authenticated')

    submitting.value = true
    error.value = null

    try {
      const totalAmount = cart.value.reduce((sum, item) => sum + item.product.base_price * item.qty, 0)
      const resolvedShiftId = shiftIdOverride !== undefined
        ? shiftIdOverride
        : (shiftsStore.currentShift?.id ?? null)

      const { data: sale, error: saleErr } = await supabase
        .from('sales')
        .insert({
          staff_id: authStore.profile.id,
          shift_id: resolvedShiftId,
          total_amount: totalAmount,
          sale_type: saleType.value,
          table_identifier: saleType.value === 'table' ? tableIdentifier.value : null,
          payment_method: paymentMethod.value,
        })
        .select('id')
        .single()
      if (saleErr) throw saleErr

      const saleItems = cart.value.map(item => ({
        sale_id: sale.id,
        product_id: item.product.id,
        qty_sold: item.qty,
        unit_price: item.product.base_price,
      }))
      const { error: itemsErr } = await supabase.from('sale_items').insert(saleItems)
      if (itemsErr) throw itemsErr

      lastSaleId.value = sale.id
      clearCart()
      return sale.id
    } catch (err: unknown) {
      error.value = (err as any)?.message ?? 'Sale failed'
      throw err
    } finally {
      submitting.value = false
    }
  }

  return {
    cart,
    products,
    loading,
    submitting,
    error,
    lastSaleId,
    saleType,
    tableIdentifier,
    paymentMethod,
    cartTotal,
    cartItemCount,
    isEmpty,
    fetchProducts,
    addToCart,
    removeFromCart,
    updateQty,
    clearCart,
    confirmSale,
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(usePosStore, import.meta.hot))
}
