<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { usePosStore } from '@/stores/posStore'
import { useShiftsStore } from '@/stores/shiftsStore'
import { useStaffRealtime } from '@/composables/useRealtime'
import type { ProductCategory } from '@/types'
import { PRODUCT_CATEGORIES } from '@/lib/constants'
import ProductButton from '@/components/pos/ProductButton.vue'
import SaleCart from '@/components/pos/SaleCart.vue'
import ShiftBanner from '@/components/pos/ShiftBanner.vue'
import AppSpinner from '@/components/ui/AppSpinner.vue'
import AppEmptyState from '@/components/ui/AppEmptyState.vue'
import { ShoppingCart } from 'lucide-vue-next'

const posStore = usePosStore()
const shiftsStore = useShiftsStore()

useStaffRealtime()

const showCart = ref(false)
const selectedCategory = ref<ProductCategory | 'all'>('all')

onMounted(async () => {
  await posStore.fetchProducts()
  await shiftsStore.initialize()
})

const categoryTabs = computed(() => {
  const cats = [...new Set(posStore.products.map(p => p.category))]
  return [
    { key: 'all', label: 'All' },
    ...cats.map(c => ({ key: c, label: PRODUCT_CATEGORIES[c]?.label ?? c })),
  ]
})

const filteredProducts = computed(() => {
  if (selectedCategory.value === 'all') return posStore.products
  return posStore.products.filter(p => p.category === selectedCategory.value)
})

const cartQty = (productId: string) => {
  const item = posStore.cart.find(i => i.product.id === productId)
  return item?.qty ?? 0
}
</script>

<template>
  <div class="pb-4">
    <ShiftBanner />

    <template v-if="shiftsStore.hasActiveShift">
      <!-- Category filter -->
      <div class="px-4 mt-4 overflow-x-auto">
        <div class="flex gap-1 min-w-max">
          <button
            v-for="tab in categoryTabs"
            :key="tab.key"
            :class="[
              'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap',
              selectedCategory === tab.key
                ? 'bg-brand-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700',
            ]"
            @click="selectedCategory = tab.key as ProductCategory | 'all'"
          >
            {{ tab.label }}
          </button>
        </div>
      </div>

      <!-- Products Grid -->
      <div class="px-4 mt-3">
        <AppSpinner v-if="posStore.loading" center />
        <div v-else class="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-2">
          <ProductButton
            v-for="product in filteredProducts"
            :key="product.id"
            :product="product"
            :cart-qty="cartQty(product.id)"
            @tap="posStore.addToCart($event)"
          />
        </div>
      </div>

      <!-- Cart FAB -->
      <button
        v-if="posStore.cartItemCount > 0"
        class="fixed bottom-20 right-4 z-20 flex items-center gap-2 bg-brand-600 hover:bg-brand-500 text-white px-4 py-3 rounded-2xl shadow-lg shadow-brand-900/40 transition-all active:scale-95"
        @click="showCart = true"
      >
        <ShoppingCart class="w-5 h-5" />
        <span class="font-semibold text-sm">{{ posStore.cartItemCount }}</span>
        <span class="text-sm">·</span>
        <span class="font-bold">€{{ posStore.cartTotal.toFixed(2) }}</span>
      </button>

      <!-- Cart Drawer -->
      <SaleCart
        :open="showCart"
        @close="showCart = false"
        @sold="showCart = false"
      />
    </template>

    <div v-else class="mt-12 px-4">
      <AppEmptyState
        title="Shift Required"
        description="Please start a shift using the banner above to process sales."
      >
        <template #icon>
          <ShoppingCart class="w-8 h-8 text-slate-500" />
        </template>
      </AppEmptyState>
    </div>
  </div>
</template>
