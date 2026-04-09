<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { usePosStore } from '@/stores/posStore'
import { useReceiverShiftsStore } from '@/stores/receiverShiftsStore'
import type { ProductCategory } from '@/types'
import { PRODUCT_CATEGORIES } from '@/lib/constants'
import ProductButton from '@/components/pos/ProductButton.vue'
import SaleCart from '@/components/pos/SaleCart.vue'
import AppSpinner from '@/components/ui/AppSpinner.vue'
import AppEmptyState from '@/components/ui/AppEmptyState.vue'
import AppCard from '@/components/ui/AppCard.vue'
import AppButton from '@/components/ui/AppButton.vue'
import { ShoppingCart, Play } from 'lucide-vue-next'
import { useToast } from '@/composables/useToast'

const posStore = usePosStore()
const receiverShiftsStore = useReceiverShiftsStore()
const toast = useToast()

const showCart = ref(false)
const selectedCategory = ref<ProductCategory | 'all'>('all')
const starting = ref(false)

onMounted(async () => {
  await posStore.fetchProducts()
  await receiverShiftsStore.initialize()
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

// Receiver POS: pass the receiver's own shift id as override
async function handleSold() {
  showCart.value = false
}

async function startShift() {
  starting.value = true
  try {
    await receiverShiftsStore.startShift()
    toast.success('Shift started!')
  } catch {
    toast.error('Failed to start shift')
  } finally {
    starting.value = false
  }
}
</script>

<template>
  <div class="pb-4">
    <!-- Shift status banner -->
    <div
      :class="[
        'mx-4 mt-4 px-4 py-2.5 rounded-xl flex items-center justify-between',
        receiverShiftsStore.hasActiveShift
          ? 'bg-emerald-500/10 border border-emerald-500/20'
          : 'bg-slate-800/60 border border-slate-700',
      ]"
    >
      <div class="flex items-center gap-2">
        <span
          :class="[
            'w-2 h-2 rounded-full',
            receiverShiftsStore.hasActiveShift ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500',
          ]"
        />
        <span
          :class="['text-xs font-medium', receiverShiftsStore.hasActiveShift ? 'text-emerald-300' : 'text-slate-400']"
        >
          {{ receiverShiftsStore.hasActiveShift
            ? `Shift active · ${receiverShiftsStore.shiftDuration}`
            : 'No active shift — start one to place sales'
          }}
        </span>
      </div>
      <AppButton
        v-if="!receiverShiftsStore.hasActiveShift"
        size="xs"
        variant="primary"
        :loading="starting"
        @click="startShift"
      >
        <Play class="w-3 h-3" /> Start
      </AppButton>
    </div>

    <template v-if="receiverShiftsStore.hasActiveShift">
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

      <!-- Cart Drawer — passes receiver's shift id as override -->
      <SaleCart
        :open="showCart"
        :shift-id-override="receiverShiftsStore.currentShift?.id ?? null"
        @close="showCart = false"
        @sold="handleSold"
      />
    </template>

    <div v-else class="mt-12 px-4">
      <AppEmptyState
        title="Shift Required"
        description="Start a shift using the banner above to process sales from this terminal."
      >
        <template #icon>
          <ShoppingCart class="w-8 h-8 text-slate-500" />
        </template>
      </AppEmptyState>
    </div>
  </div>
</template>
