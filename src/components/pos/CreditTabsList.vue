<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useCreditTabsStore } from '@/stores/creditTabsStore'
import { useFormatters } from '@/composables/useFormatters'
import { useToast } from '@/composables/useToast'
import { useConfirm } from '@/composables/useConfirm'
import { useI18n } from 'vue-i18n'
import { useProductName } from '@/composables/useProductName'
import AppSpinner from '@/components/ui/AppSpinner.vue'
import AppEmptyState from '@/components/ui/AppEmptyState.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import { CreditCard, RefreshCw } from 'lucide-vue-next'
import type { CreditTab } from '@/types'

const creditTabsStore = useCreditTabsStore()
const { formatCurrency, formatDateShort } = useFormatters()
const toast = useToast()
const { confirm } = useConfirm()
const { t } = useI18n()
const { getName } = useProductName()

const paying = ref<Record<string, boolean>>({})

onMounted(() => creditTabsStore.fetchOpenTabs())

function tabTotal(tab: CreditTab): number {
  return tab.sales?.reduce((sum, s) => sum + s.total_amount, 0) ?? 0
}

async function handleMarkPaid(tab: CreditTab) {
  const confirmed = await confirm({
    title: t('creditTabs.markPaidTitle'),
    message: t('creditTabs.markPaidMsg', { label: tab.label, amount: formatCurrency(tabTotal(tab)) }),
    confirmLabel: t('creditTabs.markPaidBtn'),
  })
  if (!confirmed) return
  paying.value[tab.id] = true
  try {
    await creditTabsStore.markAsPaid(tab.id)
    toast.success(t('creditTabs.markedPaid', { label: tab.label }))
  } catch {
    toast.error(t('creditTabs.markPaidFailed'))
  } finally {
    delete paying.value[tab.id]
  }
}
</script>

<template>
  <div class="px-4 mt-4 space-y-3 pb-4">
    <!-- Header row with refresh -->
    <div class="flex items-center justify-between">
      <p class="text-xs text-slate-500 font-medium uppercase tracking-wider">{{ t('creditTabs.openTabs') }}</p>
      <button
        class="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition-colors"
        :class="{ 'animate-spin': creditTabsStore.loading }"
        @click="creditTabsStore.fetchOpenTabs()"
      >
        <RefreshCw class="w-4 h-4" />
      </button>
    </div>

    <AppSpinner v-if="creditTabsStore.loading && creditTabsStore.openTabs.length === 0" center />

    <AppEmptyState
      v-else-if="!creditTabsStore.loading && creditTabsStore.openTabs.length === 0"
      :title="t('creditTabs.noTabs')"
      :description="t('creditTabs.noTabsDesc')"
    >
      <template #icon>
        <CreditCard class="w-8 h-8 text-slate-500" />
      </template>
    </AppEmptyState>

    <!-- Tab cards -->
    <div
      v-for="tab in creditTabsStore.openTabs"
      :key="tab.id"
      class="bg-slate-800 rounded-2xl border border-slate-700/50 p-4 space-y-3"
    >
      <!-- Tab header -->
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2 flex-wrap">
          <span class="text-base font-bold text-white">{{ tab.label }}</span>
          <AppBadge :variant="tab.sale_type === 'table' ? 'blue' : 'gray'" dot>
            {{ tab.sale_type === 'table' ? t('pos.table') : t('pos.takeaway') }}
          </AppBadge>
        </div>
        <span class="text-lg font-bold text-amber-400">{{ formatCurrency(tabTotal(tab)) }}</span>
      </div>

      <!-- Meta -->
      <p class="text-xs text-slate-500">
        {{ t('creditTabs.saleCount', { count: tab.sales?.length ?? 0 }) }}
        · {{ t('creditTabs.openedAt', { time: formatDateShort(tab.opened_at) }) }}
      </p>

      <!-- Sale items breakdown -->
      <div v-if="tab.sales && tab.sales.length > 0" class="space-y-2">
        <div
          v-for="sale in tab.sales"
          :key="sale.id"
          class="pl-3 border-l-2 border-slate-700 space-y-0.5"
        >
          <div
            v-for="item in sale.sale_items"
            :key="item.product?.id ?? item.product_id"
            class="flex justify-between text-xs text-slate-400"
          >
            <span>{{ item.qty_sold }}× {{ item.product ? getName(item.product) : '—' }}</span>
            <span>{{ formatCurrency(item.unit_price * item.qty_sold) }}</span>
          </div>
        </div>
      </div>

      <!-- Mark as Paid -->
      <AppButton
        variant="primary"
        size="sm"
        full-width
        :loading="!!paying[tab.id]"
        @click="handleMarkPaid(tab)"
      >
        {{ t('creditTabs.markPaidBtn') }}
      </AppButton>
    </div>
  </div>
</template>
