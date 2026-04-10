<script setup lang="ts">
import { computed } from 'vue'
import type { InventoryItem } from '@/types'
import { getStockStatus } from '@/types'
import { useI18n } from 'vue-i18n'
import { STOCK_STATUS_CONFIG } from '@/lib/constants'

const { t } = useI18n()

interface Props {
  item: InventoryItem
  showLabels?: boolean
}
const props = withDefaults(defineProps<Props>(), { showLabels: false })

const status = computed(() => getStockStatus(props.item))
const config = computed(() => STOCK_STATUS_CONFIG[status.value])

// Calculate fill % based on a "comfortable" max (3x warning threshold)
const maxQty = computed(() => Math.max(props.item.warning_threshold * 3, props.item.stock_qty))
const fillPct = computed(() => Math.min(100, (props.item.stock_qty / maxQty.value) * 100))
const warningPct = computed(() => (props.item.warning_threshold / maxQty.value) * 100)
const criticalPct = computed(() => (props.item.critical_threshold / maxQty.value) * 100)
</script>

<template>
  <div class="w-full">
    <div v-if="showLabels" class="flex justify-between text-xs text-slate-500 mb-1">
      <span>{{ item.stock_qty }} {{ item.unit }}</span>
      <span>{{ t('common.max') }} ~{{ maxQty }} {{ item.unit }}</span>
    </div>
    <div class="relative h-2 bg-slate-700 rounded-full overflow-hidden">
      <!-- Fill bar -->
      <div
        :class="['h-full rounded-full transition-all duration-500', config.barClass]"
        :style="{ width: `${fillPct}%` }"
      />
      <!-- Warning marker -->
      <div
        class="absolute top-0 bottom-0 w-px bg-amber-400/60"
        :style="{ left: `${warningPct}%` }"
      />
      <!-- Critical marker -->
      <div
        class="absolute top-0 bottom-0 w-px bg-red-400/60"
        :style="{ left: `${criticalPct}%` }"
      />
    </div>
  </div>
</template>
