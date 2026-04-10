<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useOrdersStore } from '@/stores/ordersStore'
import { useToast } from '@/composables/useToast'
import { useConfirm } from '@/composables/useConfirm'
import { useFormatters } from '@/composables/useFormatters'
import { useI18n } from 'vue-i18n'
import { useProductName } from '@/composables/useProductName'
import AppCard from '@/components/ui/AppCard.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppSpinner from '@/components/ui/AppSpinner.vue'
import AppEmptyState from '@/components/ui/AppEmptyState.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import AppTabs from '@/components/ui/AppTabs.vue'
import { Minus, Plus, Trash2, CheckCircle, ClipboardList, Cpu, Package, PackageCheck } from 'lucide-vue-next'

const store = useOrdersStore()
const toast = useToast()
const { confirm } = useConfirm()
const { formatDate } = useFormatters()
const { t } = useI18n()
const { getName } = useProductName()

const activeTab = ref<'draft' | 'finalized' | 'delivered'>('draft')
const finalizing = ref(false)
const delivering = ref<string | null>(null)
const receivingItem = ref<string | null>(null)

const tabs = computed(() => [
  { key: 'draft', label: t('orders.pendingOrders'), count: draftOrders.value.length || undefined },
  { key: 'finalized', label: t('orders.toBeDelivered'), count: finalizedOrders.value.length || undefined },
  { key: 'delivered', label: t('orders.delivered') },
])

onMounted(() => {
  store.fetchAll()
  store.fetchDraftOrder()
})

const draftOrders = computed(() => store.orders.filter(o => o.status === 'draft'))
const finalizedOrders = computed(() => store.orders.filter(o => o.status === 'finalized'))
const deliveredOrders = computed(() => store.orders.filter(o => o.status === 'delivered'))

function orderDisplayName(order: { id: string; name?: string | null }) {
  return order.name?.trim() || `#${order.id.slice(-6).toUpperCase()}`
}

function receivedCount(order: { order_items?: { received: boolean }[] }) {
  return order.order_items?.filter(i => i.received).length ?? 0
}

function allReceived(order: { order_items?: { received: boolean }[] }) {
  const items = order.order_items ?? []
  return items.length > 0 && items.every(i => i.received)
}

async function handleFinalize(orderId: string) {
  const ok = await confirm({
    title: t('orders.placeOrder'),
    message: t('orders.placeOrderMsg'),
    confirmLabel: t('orders.placeOrderBtn'),
  })
  if (!ok) return
  finalizing.value = true
  try {
    await store.finalizeOrder(orderId)
    toast.success(t('orders.orderPlaced'), t('orders.orderPlacedDesc'))
    activeTab.value = 'finalized'
  } catch {
    toast.error(t('orders.placeOrderFailed'))
  } finally {
    finalizing.value = false
  }
}

async function handleMarkReceived(orderItemId: string, inventoryId: string, qty: number) {
  receivingItem.value = orderItemId
  try {
    await store.markItemReceived(orderItemId, inventoryId, qty)
    toast.success(t('orders.itemReceived'), t('orders.inventoryUpdated'))
  } catch {
    toast.error(t('orders.itemReceivedFailed'))
  } finally {
    receivingItem.value = null
  }
}

async function handleMarkDelivered(orderId: string) {
  const ok = await confirm({
    title: t('orders.completeDelivery'),
    message: t('orders.completeDeliveryMsg'),
    confirmLabel: t('orders.markDelivered'),
  })
  if (!ok) return
  delivering.value = orderId
  try {
    await store.markOrderDelivered(orderId)
    toast.success(t('orders.orderDelivered'), t('orders.allItemsReceived'))
    activeTab.value = 'delivered'
  } catch {
    toast.error(t('orders.deliveryFailed'))
  } finally {
    delivering.value = null
  }
}
</script>

<template>
  <div class="space-y-4">
    <AppTabs :tabs="tabs" v-model="activeTab" />

    <!-- Pending Orders (draft) -->
    <div v-if="activeTab === 'draft'">
      <AppSpinner v-if="store.loading" center />
      <AppEmptyState
        v-else-if="draftOrders.length === 0"
        :title="t('orders.noPendingOrders')"
        :description="t('orders.noPendingDesc')"
      >
        <template #icon><ClipboardList class="w-8 h-8 text-slate-500" /></template>
      </AppEmptyState>

      <div v-else class="space-y-4">
        <AppCard
          v-for="order in draftOrders"
          :key="order.id"
          padding="none"
        >
          <div class="flex items-center justify-between px-4 pt-4 pb-3 border-b border-slate-700">
            <div>
              <p class="text-sm font-semibold text-white">{{ orderDisplayName(order) }}</p>
              <p class="text-xs text-slate-500">{{ formatDate(order.created_at) }} · {{ t('orders.itemCount', { count: order.order_items?.length ?? 0 }) }}</p>
            </div>
            <AppButton size="sm" :loading="finalizing" @click="handleFinalize(order.id)">
              <CheckCircle class="w-4 h-4" /> {{ t('orders.placeOrder') }}
            </AppButton>
          </div>

          <div class="divide-y divide-slate-700/50">
            <div
              v-for="oi in order.order_items"
              :key="oi.id"
              class="flex items-center gap-3 px-4 py-3"
            >
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-1.5">
                  <p class="text-sm text-white truncate">{{ oi.inventory ? getName(oi.inventory) : '' }}</p>
                  <span v-if="oi.source === 'auto_threshold'" class="inline-flex items-center gap-1 text-xs text-brand-400">
                    <Cpu class="w-3 h-3" />{{ t('common.auto') }}
                  </span>
                </div>
                <p class="text-xs text-slate-500">{{ oi.notes }}</p>
              </div>
              <div class="flex items-center gap-2">
                <button
                  class="w-6 h-6 flex items-center justify-center rounded bg-slate-600 hover:bg-slate-500 text-white transition-colors"
                  @click="store.updateItemQty(oi.id, oi.quantity_requested - 1)"
                >
                  <Minus class="w-3 h-3" />
                </button>
                <span class="text-sm font-bold text-white w-8 text-center">{{ oi.quantity_requested }}</span>
                <button
                  class="w-6 h-6 flex items-center justify-center rounded bg-slate-600 hover:bg-slate-500 text-white transition-colors"
                  @click="store.updateItemQty(oi.id, oi.quantity_requested + 1)"
                >
                  <Plus class="w-3 h-3" />
                </button>
                <span class="text-xs text-slate-500 ml-1">{{ oi.inventory?.unit }}</span>
              </div>
              <button class="text-slate-500 hover:text-red-400" @click="store.removeItem(oi.id)">
                <Trash2 class="w-4 h-4" />
              </button>
            </div>
          </div>
        </AppCard>
      </div>
    </div>

    <!-- To Be Delivered (finalized) -->
    <div v-else-if="activeTab === 'finalized'">
      <AppSpinner v-if="store.loading" center />
      <AppEmptyState
        v-else-if="finalizedOrders.length === 0"
        :title="t('orders.noAwaitingDelivery')"
        :description="t('orders.noAwaitingDesc')"
      >
        <template #icon><Package class="w-8 h-8 text-slate-500" /></template>
      </AppEmptyState>

      <div v-else class="space-y-4">
        <AppCard
          v-for="order in finalizedOrders"
          :key="order.id"
          padding="none"
        >
          <!-- Order Header -->
          <div class="flex items-start justify-between px-4 pt-4 pb-3 border-b border-slate-700">
            <div>
              <p class="text-sm font-semibold text-white">{{ orderDisplayName(order) }}</p>
              <p class="text-xs text-slate-500">{{ t('orders.ordered', { date: formatDate(order.finalized_at ?? order.created_at) }) }}</p>
              <p class="text-xs text-slate-400 mt-0.5">
                {{ t('orders.itemsReceived', { received: receivedCount(order), total: order.order_items?.length ?? 0 }) }}
              </p>
            </div>
            <div class="flex items-center gap-2">
              <!-- Progress ring placeholder — simple badge -->
              <AppBadge v-if="allReceived(order)" variant="green" dot>{{ t('orders.allReceived') }}</AppBadge>
              <AppBadge v-else variant="amber" dot>{{ t('orders.pending') }}</AppBadge>
            </div>
          </div>

          <!-- Items with delivery checkboxes -->
          <div class="divide-y divide-slate-700/50">
            <div
              v-for="oi in order.order_items"
              :key="oi.id"
              class="flex items-center gap-3 px-4 py-3"
              :class="oi.received ? 'opacity-60' : ''"
            >
              <!-- Checkbox -->
              <button
                class="shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all"
                :class="oi.received
                  ? 'bg-emerald-500 border-emerald-500 cursor-default'
                  : 'border-slate-500 hover:border-emerald-400 bg-transparent cursor-pointer'"
                :disabled="oi.received || receivingItem === oi.id"
                @click="!oi.received && handleMarkReceived(oi.id, oi.inventory_id, oi.quantity_requested)"
              >
                <CheckCircle v-if="oi.received" class="w-4 h-4 text-white" />
                <AppSpinner v-else-if="receivingItem === oi.id" class="w-3 h-3" />
              </button>

              <!-- Item info -->
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-1.5">
                  <p class="text-sm text-white truncate" :class="oi.received ? 'line-through text-slate-400' : ''">
                    {{ oi.inventory ? getName(oi.inventory) : '' }}
                  </p>
                  <span v-if="oi.source === 'auto_threshold'" class="inline-flex items-center gap-1 text-xs text-brand-400">
                    <Cpu class="w-3 h-3" />{{ t('common.auto') }}
                  </span>
                </div>
                <p class="text-xs text-slate-500">
                  {{ oi.quantity_requested }} {{ oi.inventory?.unit }}
                  <span v-if="oi.received && oi.received_at" class="text-emerald-500"> · {{ t('orders.placed', { date: formatDate(oi.received_at) }) }}</span>
                </p>
              </div>
            </div>
          </div>

          <!-- Footer: Mark as Delivered button -->
          <div class="px-4 py-3 border-t border-slate-700">
            <AppButton
              full-width
              :disabled="!allReceived(order)"
              :loading="delivering === order.id"
              variant="primary"
              @click="handleMarkDelivered(order.id)"
            >
              <PackageCheck class="w-4 h-4" />
              {{ allReceived(order) ? t('orders.markAsDelivered') : t('orders.waitingFor', { count: (order.order_items?.length ?? 0) - receivedCount(order) }) }}
            </AppButton>
          </div>
        </AppCard>
      </div>
    </div>

    <!-- Delivered (history) -->
    <div v-else>
      <AppSpinner v-if="store.loading" center />
      <AppEmptyState
        v-else-if="deliveredOrders.length === 0"
        :title="t('orders.noDeliveredYet')"
        :description="t('orders.noDeliveredDesc')"
      >
        <template #icon><PackageCheck class="w-8 h-8 text-slate-500" /></template>
      </AppEmptyState>

      <div v-else class="space-y-3">
        <AppCard
          v-for="order in deliveredOrders"
          :key="order.id"
          padding="none"
        >
          <div class="px-4 pt-4 pb-3 border-b border-slate-700 flex items-start justify-between">
            <div>
              <p class="text-sm font-semibold text-white">{{ orderDisplayName(order) }}</p>
              <p class="text-xs text-slate-500">{{ t('orders.ordered', { date: formatDate(order.created_at) }) }}</p>
              <p v-if="order.finalized_at" class="text-xs text-slate-500">{{ t('orders.placed', { date: formatDate(order.finalized_at) }) }}</p>
            </div>
            <AppBadge variant="green" dot>{{ t('orders.delivered') }}</AppBadge>
          </div>
          <div class="divide-y divide-slate-700/50">
            <div
              v-for="oi in order.order_items"
              :key="oi.id"
              class="flex items-center gap-3 px-4 py-2.5 opacity-70"
            >
              <CheckCircle class="w-4 h-4 text-emerald-500 shrink-0" />
              <div class="flex-1 min-w-0">
                <p class="text-sm text-slate-300 truncate">{{ oi.inventory ? getName(oi.inventory) : '' }}</p>
                <p class="text-xs text-slate-500">{{ oi.quantity_requested }} {{ oi.inventory?.unit }}</p>
              </div>
            </div>
          </div>
        </AppCard>
      </div>
    </div>
  </div>
</template>
