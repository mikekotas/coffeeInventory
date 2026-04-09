<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useOrdersStore } from '@/stores/ordersStore'
import { useToast } from '@/composables/useToast'
import { useConfirm } from '@/composables/useConfirm'
import { useFormatters } from '@/composables/useFormatters'
import AppCard from '@/components/ui/AppCard.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppSpinner from '@/components/ui/AppSpinner.vue'
import AppEmptyState from '@/components/ui/AppEmptyState.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import AppTabs from '@/components/ui/AppTabs.vue'
import { Minus, Plus, Trash2, CheckCircle, ClipboardList, Cpu } from 'lucide-vue-next'

const store = useOrdersStore()
const toast = useToast()
const { confirm } = useConfirm()
const { formatDate } = useFormatters()

const activeTab = ref<'draft' | 'finalized'>('draft')
const finalizing = ref(false)

const tabs = [
  { key: 'draft', label: 'Pending Orders' },
  { key: 'finalized', label: 'Finalized' },
]

onMounted(() => {
  store.fetchAll()
  store.fetchDraftOrder()
})

const draftOrders = () => store.orders.filter(o => o.status === 'draft')
const finalizedOrders = () => store.orders.filter(o => o.status === 'finalized')

async function handleFinalize(orderId: string) {
  const ok = await confirm({
    title: 'Finalize Order',
    message: 'Mark this order as finalized? This means all items have been ordered/received.',
    confirmLabel: 'Finalize',
  })
  if (!ok) return
  finalizing.value = true
  try {
    await store.finalizeOrder(orderId)
    toast.success('Order finalized!')
  } catch {
    toast.error('Failed to finalize order')
  } finally {
    finalizing.value = false
  }
}
</script>

<template>
  <div class="space-y-4">
    <AppTabs :tabs="tabs" v-model="activeTab" />

    <!-- Draft Orders -->
    <div v-if="activeTab === 'draft'">
      <AppSpinner v-if="store.loading" center />
      <AppEmptyState
        v-else-if="draftOrders().length === 0"
        title="No pending orders"
        description="Orders are created automatically when stock falls below warning levels, or manually by staff from the checklist."
      >
        <template #icon><ClipboardList class="w-8 h-8 text-slate-500" /></template>
      </AppEmptyState>

      <div v-else class="space-y-4">
        <AppCard
          v-for="order in draftOrders()"
          :key="order.id"
          padding="none"
        >
          <div class="flex items-center justify-between px-4 pt-4 pb-3 border-b border-slate-700">
            <div>
              <p class="text-sm font-semibold text-white">Order #{{ order.id.slice(-6).toUpperCase() }}</p>
              <p class="text-xs text-slate-500">{{ formatDate(order.created_at) }} · {{ order.order_items?.length ?? 0 }} items</p>
            </div>
            <AppButton size="sm" :loading="finalizing" @click="handleFinalize(order.id)">
              <CheckCircle class="w-4 h-4" /> Finalize
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
                  <p class="text-sm text-white truncate">{{ oi.inventory?.name }}</p>
                  <span v-if="oi.source === 'auto_threshold'" class="inline-flex items-center gap-1 text-xs text-brand-400">
                    <Cpu class="w-3 h-3" />Auto
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

    <!-- Finalized Orders -->
    <div v-else>
      <AppSpinner v-if="store.loading" center />
      <AppEmptyState
        v-else-if="finalizedOrders().length === 0"
        title="No finalized orders yet"
        description="Finalized orders will appear here"
      />
      <div v-else class="space-y-3">
        <AppCard
          v-for="order in finalizedOrders()"
          :key="order.id"
          padding="md"
        >
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-semibold text-white">Order #{{ order.id.slice(-6).toUpperCase() }}</p>
              <p class="text-xs text-slate-500">Created {{ formatDate(order.created_at) }}</p>
              <p v-if="order.finalized_at" class="text-xs text-emerald-400">
                Finalized {{ formatDate(order.finalized_at) }}
              </p>
            </div>
            <AppBadge variant="green" dot>Finalized</AppBadge>
          </div>
          <p class="text-xs text-slate-500 mt-2">{{ order.order_items?.length ?? 0 }} items ordered</p>
        </AppCard>
      </div>
    </div>
  </div>
</template>
