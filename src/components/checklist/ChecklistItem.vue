<script setup lang="ts">
import type { InventoryItem } from '@/types'
import { getStockStatus } from '@/types'
import { useOrdersStore } from '@/stores/ordersStore'
import { useToast } from '@/composables/useToast'
import { useI18n } from 'vue-i18n'
import ThresholdBadge from '@/components/inventory/ThresholdBadge.vue'
import StockBar from '@/components/inventory/StockBar.vue'
import AppButton from '@/components/ui/AppButton.vue'
import { Plus } from 'lucide-vue-next'

const { t } = useI18n()

interface Props {
  item: InventoryItem
}
defineProps<Props>()

const ordersStore = useOrdersStore()
const toast = useToast()
const adding = ref(false)

async function addToOrder(item: InventoryItem) {
  adding.value = true
  try {
    await ordersStore.addItem(item.id)
    toast.success(t('checklist.addToOrder'), t('checklist.addToOrderDesc', { name: item.name }))
  } catch (err: unknown) {
    const msg = (err as any)?.message ?? String(err)
    console.error('[ChecklistItem] Failed to add to order:', err)
    toast.error(t('checklist.addFailed'), msg)
  } finally {
    adding.value = false
  }
}

import { ref } from 'vue'
</script>

<template>
  <div
    :class="[
      'flex items-center gap-3 px-4 py-3 border-b border-slate-700/50 transition-colors',
      getStockStatus(item) === 'critical' || getStockStatus(item) === 'out'
        ? 'bg-red-500/5'
        : getStockStatus(item) === 'warning'
        ? 'bg-amber-500/5'
        : '',
    ]"
  >
    <div class="flex-1 min-w-0">
      <div class="flex items-center gap-2 mb-1">
        <p class="text-sm font-medium text-white truncate">{{ item.name }}</p>
        <ThresholdBadge :item="item" :show-qty="false" />
      </div>
      <StockBar :item="item" />
      <p class="text-xs text-slate-500 mt-1">
        {{ item.stock_qty }} {{ item.unit }} •
        {{ t('checklist.warningAt', { threshold: item.warning_threshold, unit: item.unit }) }}
      </p>
    </div>

    <AppButton
      size="xs"
      variant="outline"
      :loading="adding"
      class="shrink-0"
      @click="addToOrder(item)"
    >
      <Plus class="w-3.5 h-3.5" />
      {{ t('checklist.order') }}
    </AppButton>
  </div>
</template>
