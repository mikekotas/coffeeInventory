import { defineStore, acceptHMRUpdate } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from './authStore'
import type { CreditTab } from '@/types'

export const useCreditTabsStore = defineStore('creditTabs', () => {
  const openTabs = ref<CreditTab[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const openTabCount = computed(() => openTabs.value.length)

  async function fetchOpenTabs(): Promise<void> {
    loading.value = true
    error.value = null
    try {
      const { data, error: err } = await supabase
        .from('credit_tabs')
        .select(`
          *,
          opener:profiles!credit_tabs_staff_id_fkey(id, full_name),
          sales(
            id, total_amount, created_at, payment_method,
            sale_items(qty_sold, unit_price, product:products(id, name, name_el))
          )
        `)
        .eq('status', 'open')
        .order('opened_at', { ascending: true })
      if (err) throw err
      openTabs.value = (data ?? []) as CreditTab[]
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch tabs'
    } finally {
      loading.value = false
    }
  }

  async function findOrCreateTab(label: string, saleType: 'takeaway' | 'table'): Promise<CreditTab> {
    const authStore = useAuthStore()
    if (!authStore.profile) throw new Error('Not authenticated')

    const { data: existing, error: findErr } = await supabase
      .from('credit_tabs')
      .select('*')
      .eq('label', label)
      .eq('sale_type', saleType)
      .eq('status', 'open')
      .maybeSingle()
    if (findErr) throw findErr
    if (existing) return existing as CreditTab

    const { data: created, error: createErr } = await supabase
      .from('credit_tabs')
      .insert({
        staff_id: authStore.profile.id,
        label,
        sale_type: saleType,
        status: 'open',
      })
      .select('*')
      .single()
    if (createErr) throw createErr
    return created as CreditTab
  }

  async function markAsPaid(tabId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser()
    const { error: err } = await supabase
      .from('credit_tabs')
      .update({
        status: 'paid',
        paid_at: new Date().toISOString(),
        paid_by: user?.id ?? null,
      })
      .eq('id', tabId)
    if (err) throw err
    openTabs.value = openTabs.value.filter(t => t.id !== tabId)
  }

  return {
    openTabs,
    loading,
    error,
    openTabCount,
    fetchOpenTabs,
    findOrCreateTab,
    markAsPaid,
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useCreditTabsStore, import.meta.hot))
}
