import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from './authStore'
import type { Invoice, InvoiceForm } from '@/types'

export const useInvoicesStore = defineStore('invoices', () => {
  const invoices = ref<Invoice[]>([])
  const loading = ref(false)

  const totalSpend = computed(() => invoices.value.reduce((sum, inv) => sum + inv.amount, 0))
  const monthlySpend = computed(() => {
    const now = new Date()
    const thisMonth = invoices.value.filter(inv => {
      const d = new Date(inv.invoice_date)
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    })
    return thisMonth.reduce((sum, inv) => sum + inv.amount, 0)
  })

  async function fetchAll() {
    loading.value = true
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('*, admin:profiles(id, full_name)')
        .order('invoice_date', { ascending: false })
      if (error) throw error
      invoices.value = (data ?? []) as Invoice[]
    } finally {
      loading.value = false
    }
  }

  async function create(form: InvoiceForm, file?: File): Promise<Invoice> {
    const authStore = useAuthStore()
    if (!authStore.profile) throw new Error('Not authenticated')

    let fileUrl: string | undefined

    if (file) {
      const fileName = `${Date.now()}_${file.name.replace(/\s/g, '_')}`
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('invoices')
        .upload(`${authStore.profile.id}/${fileName}`, file)

      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage
        .from('invoices')
        .getPublicUrl(uploadData.path)

      fileUrl = urlData.publicUrl
    }

    const { data, error } = await supabase
      .from('invoices')
      .insert({
        admin_id: authStore.profile.id,
        amount: form.amount,
        description: form.description,
        supplier: form.supplier || null,
        invoice_date: form.invoice_date,
        file_url: fileUrl ?? form.file_url ?? null,
      })
      .select('*, admin:profiles(id, full_name)')
      .single()

    if (error) throw error
    invoices.value.unshift(data as Invoice)
    return data as Invoice
  }

  async function remove(id: string) {
    const { error } = await supabase.from('invoices').delete().eq('id', id)
    if (error) throw error
    invoices.value = invoices.value.filter(i => i.id !== id)
  }

  return {
    invoices,
    loading,
    totalSpend,
    monthlySpend,
    fetchAll,
    create,
    remove,
  }
})
