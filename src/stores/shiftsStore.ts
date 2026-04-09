import { defineStore, acceptHMRUpdate } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from './authStore'
import { LS_KEYS } from '@/lib/constants'
import type { Shift } from '@/types'

export const useShiftsStore = defineStore('shifts', () => {
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
    // Restore shift from localStorage
    const savedShiftId = localStorage.getItem(LS_KEYS.currentShiftId)
    if (savedShiftId) {
      await fetchShiftById(savedShiftId)
      // If shift is no longer active, clear it
      if (currentShift.value && !currentShift.value.is_active) {
        currentShift.value = null
        localStorage.removeItem(LS_KEYS.currentShiftId)
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

    // End any other active shifts for this user
    await supabase
      .from('shifts')
      .update({ is_active: false, ended_at: new Date().toISOString() })
      .eq('staff_id', authStore.profile.id)
      .eq('is_active', true)

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
    localStorage.setItem(LS_KEYS.currentShiftId, data.id)
    return data as Shift
  }

  async function endShift(notes?: string) {
    if (!currentShift.value) throw new Error('No active shift')

    const { data, error } = await supabase
      .from('shifts')
      .update({
        is_active: false,
        ended_at: new Date().toISOString(),
        notes: notes ?? currentShift.value.notes,
      })
      .eq('id', currentShift.value.id)
      .select()
      .single()

    if (error) throw error
    currentShift.value = data as Shift
    localStorage.removeItem(LS_KEYS.currentShiftId)
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
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useShiftsStore, import.meta.hot))
}
