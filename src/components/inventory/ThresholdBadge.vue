<script setup lang="ts">
import type { InventoryItem } from '@/types'
import { getStockStatus } from '@/types'
import { STOCK_STATUS_CONFIG } from '@/lib/constants'

interface Props {
  item: InventoryItem
  showQty?: boolean
}
const props = withDefaults(defineProps<Props>(), { showQty: true })
const status = () => getStockStatus(props.item)
const config = () => STOCK_STATUS_CONFIG[status()]
</script>

<template>
  <span
    :class="[
      'inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full',
      config().bgClass,
      config().textClass,
    ]"
  >
    <span :class="['w-1.5 h-1.5 rounded-full shrink-0', config().dotClass]" />
    {{ config().label }}
    <span v-if="showQty" class="opacity-75">
      ({{ item.stock_qty }} {{ item.unit }})
    </span>
  </span>
</template>
