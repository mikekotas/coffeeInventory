<script setup lang="ts">
import type { Product } from '@/types'
import { useFormatters } from '@/composables/useFormatters'
import { useProductName } from '@/composables/useProductName'

interface Props {
  product: Product
  cartQty?: number
}
withDefaults(defineProps<Props>(), { cartQty: 0 })
const emit = defineEmits<{ tap: [product: Product] }>()

const { formatCurrency } = useFormatters()
const { getName } = useProductName()

const categoryEmojis: Record<string, string> = {
  coffee: '☕',
  beer: '🍺',
  alcohol: '🥃',
  soft_drink: '🥤',
  food: '🍽️',
  other: '📦',
}
</script>

<template>
  <button
    class="relative flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl border transition-all duration-150 active:scale-95 focus:outline-none focus:ring-2 focus:ring-brand-500 text-center min-h-[90px]"
    :class="[
      cartQty > 0
        ? 'bg-brand-600/20 border-brand-500/50 shadow-md shadow-brand-900/20'
        : 'bg-slate-800 border-slate-700/50 hover:bg-slate-700/60 hover:border-slate-600',
    ]"
    @click="emit('tap', product)"
  >
    <!-- Cart qty badge -->
    <span
      v-if="cartQty > 0"
      class="absolute top-1.5 right-1.5 min-w-[20px] h-5 flex items-center justify-center text-xs font-bold bg-brand-500 text-white rounded-full px-1"
    >
      {{ cartQty }}
    </span>

    <!-- Emoji -->
    <span class="text-2xl leading-none">{{ categoryEmojis[product.category] ?? '☕' }}</span>

    <!-- Name -->
    <span class="text-xs font-semibold text-white leading-tight line-clamp-2">{{ getName(product) }}</span>

    <!-- Price -->
    <span class="text-xs text-slate-400 font-medium">{{ formatCurrency(product.base_price) }}</span>
  </button>
</template>
