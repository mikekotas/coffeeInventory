import { defineStore, acceptHMRUpdate } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'
import type { Notification } from '@/types'

export const useNotificationsStore = defineStore('notifications', () => {
  const notifications = ref<Notification[]>([])
  const loading = ref(false)

  const unread = computed(() => notifications.value.filter(n => n.status === 'unread'))
  const unreadCount = computed(() => unread.value.length)
  const criticalUnread = computed(() => unread.value.filter(n => n.severity === 'critical'))

  async function fetchAll() {
    loading.value = true
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*, inventory:inventory(id, name, unit)')
        .order('created_at', { ascending: false })
        .limit(100)
      if (error) throw error
      notifications.value = (data ?? []) as Notification[]
    } finally {
      loading.value = false
    }
  }

  async function markRead(id: string) {
    const { error } = await supabase
      .from('notifications')
      .update({ status: 'read' })
      .eq('id', id)
    if (error) throw error
    const n = notifications.value.find(n => n.id === id)
    if (n) n.status = 'read'
  }

  async function markAllRead() {
    const ids = unread.value.map(n => n.id)
    if (!ids.length) return
    const { error } = await supabase
      .from('notifications')
      .update({ status: 'read' })
      .in('id', ids)
    if (error) throw error
    notifications.value.forEach(n => { n.status = 'read' })
  }

  function subscribeRealtime() {
    const channel = supabase
      .channel('notifications-changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, (payload) => {
        // Prepend new notification
        notifications.value.unshift(payload.new as Notification)
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'notifications' }, (payload) => {
        const updated = payload.new as Notification
        const idx = notifications.value.findIndex(n => n.id === updated.id)
        if (idx !== -1) notifications.value[idx] = updated
      })
      .subscribe()
    return () => supabase.removeChannel(channel)
  }

  return {
    notifications,
    loading,
    unread,
    unreadCount,
    criticalUnread,
    fetchAll,
    markRead,
    markAllRead,
    subscribeRealtime,
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useNotificationsStore, import.meta.hot))
}
