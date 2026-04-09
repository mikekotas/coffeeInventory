import { defineStore, acceptHMRUpdate } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'
import type { Sale, DailyRevenue, ShiftSales, TopProduct } from '@/types'

export const useSalesStore = defineStore('sales', () => {
  const sales = ref<Sale[]>([])
  const mySales = ref<Sale[]>([])
  const dailyRevenue = ref<DailyRevenue[]>([])
  const shiftSales = ref<ShiftSales[]>([])
  const topProducts = ref<TopProduct[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const totalRevenue = computed(() =>
    sales.value.reduce((sum, s) => sum + s.total_amount, 0)
  )
  const todayRevenue = computed(() => {
    const today = new Date().toDateString()
    return sales.value
      .filter(s => new Date(s.created_at).toDateString() === today)
      .reduce((sum, s) => sum + s.total_amount, 0)
  })

  async function fetchAll(limitDays = 30) {
    loading.value = true
    error.value = null
    try {
      const since = new Date()
      since.setDate(since.getDate() - limitDays)

      const { data, error: err } = await supabase
        .from('sales')
        .select(`
          *,
          profile:profiles(id, full_name, role),
          shift:shifts(id, started_at, ended_at),
          sale_items(*, product:products(*))
        `)
        .gte('created_at', since.toISOString())
        .order('created_at', { ascending: false })

      if (err) throw err
      sales.value = (data ?? []) as Sale[]
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch sales'
    } finally {
      loading.value = false
    }
  }

  async function fetchMine(staffId: string) {
    loading.value = true
    error.value = null
    try {
      const { data, error: err } = await supabase
        .from('sales')
        .select(`
          *,
          shift:shifts(id, started_at, ended_at),
          sale_items(*, product:products(*))
        `)
        .eq('staff_id', staffId)
        .order('created_at', { ascending: false })
        .limit(100)

      if (err) throw err
      mySales.value = (data ?? []) as Sale[]
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch my sales'
    } finally {
      loading.value = false
    }
  }

  async function fetchByShift(shiftId: string): Promise<Sale[]> {
    const { data, error: err } = await supabase
      .from('sales')
      .select('*, sale_items(*, product:products(*))')
      .eq('shift_id', shiftId)
      .order('created_at', { ascending: false })
    if (err) throw err
    return (data ?? []) as Sale[]
  }

  async function fetchDailyRevenue(daysBack = 30) {
    const { data, error: err } = await supabase.rpc('get_daily_revenue', { days_back: daysBack })
    if (err) throw err
    dailyRevenue.value = (data ?? []) as DailyRevenue[]
  }

  async function fetchShiftSales(staffId?: string) {
    const { data, error: err } = await supabase.rpc('get_shift_sales', {
      target_staff_id: staffId ?? null,
    })
    if (err) throw err
    shiftSales.value = (data ?? []) as ShiftSales[]
  }

  async function fetchTopProducts(daysBack = 30) {
    const { data, error: err } = await supabase.rpc('get_top_products', {
      days_back: daysBack,
      limit_n: 10,
    })
    if (err) throw err
    topProducts.value = (data ?? []) as TopProduct[]
  }

  return {
    sales,
    mySales,
    dailyRevenue,
    shiftSales,
    topProducts,
    loading,
    error,
    totalRevenue,
    todayRevenue,
    fetchAll,
    fetchMine,
    fetchByShift,
    fetchDailyRevenue,
    fetchShiftSales,
    fetchTopProducts,
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useSalesStore, import.meta.hot))
}
