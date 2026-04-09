import { onMounted, onUnmounted } from 'vue'
import { useInventoryStore } from '@/stores/inventoryStore'
import { useNotificationsStore } from '@/stores/notificationsStore'
import { useOrdersStore } from '@/stores/ordersStore'

export function useAdminRealtime() {
  const inventoryStore = useInventoryStore()
  const notificationsStore = useNotificationsStore()
  const ordersStore = useOrdersStore()

  let unsubInventory: (() => void) | null = null
  let unsubNotifications: (() => void) | null = null
  let unsubOrders: (() => void) | null = null

  onMounted(() => {
    unsubInventory = inventoryStore.subscribeRealtime()
    unsubNotifications = notificationsStore.subscribeRealtime()
    unsubOrders = ordersStore.subscribeRealtime()
  })

  onUnmounted(() => {
    unsubInventory?.()
    unsubNotifications?.()
    unsubOrders?.()
  })
}

export function useStaffRealtime() {
  const inventoryStore = useInventoryStore()

  let unsubInventory: (() => void) | null = null

  onMounted(() => {
    unsubInventory = inventoryStore.subscribeRealtime()
  })

  onUnmounted(() => {
    unsubInventory?.()
  })
}
