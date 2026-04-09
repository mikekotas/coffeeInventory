<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useProductsStore } from '@/stores/productsStore'
import { useInventoryStore } from '@/stores/inventoryStore'
import AppSpinner from '@/components/ui/AppSpinner.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import AppModal from '@/components/ui/AppModal.vue'
import AppButton from '@/components/ui/AppButton.vue'
import RecipeBuilder from '@/components/recipes/RecipeBuilder.vue'
import { PRODUCT_CATEGORIES } from '@/lib/constants'
import type { Product } from '@/types'
import { BookOpen } from 'lucide-vue-next'

const productsStore = useProductsStore()
const inventoryStore = useInventoryStore()
const selected = ref<Product | null>(null)
const showModal = ref(false)

const categoryVariants: Record<string, 'amber' | 'yellow' | 'purple' | 'blue' | 'green' | 'gray'> = {
  coffee: 'amber', beer: 'yellow', alcohol: 'purple', soft_drink: 'blue', food: 'green', other: 'gray',
}

onMounted(async () => {
  await Promise.all([productsStore.fetchAll(), inventoryStore.fetchAll()])
})

function openRecipe(product: Product) {
  selected.value = product
  showModal.value = true
}
</script>

<template>
  <div class="space-y-4">
    <p class="text-sm text-slate-400">
      Define what ingredients each product consumes when sold. Stock will be automatically deducted on every sale.
    </p>

    <AppSpinner v-if="productsStore.loading" center />

    <div v-else class="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
      <div
        v-for="product in productsStore.products.filter(p => p.is_active)"
        :key="product.id"
        class="bg-slate-800 border border-slate-700/50 rounded-2xl p-4 hover:border-slate-600 transition-colors cursor-pointer"
        @click="openRecipe(product)"
      >
        <div class="flex items-start justify-between gap-2">
          <div class="flex-1 min-w-0">
            <p class="font-medium text-white text-sm truncate">{{ product.name }}</p>
            <p class="text-xs text-slate-500 mt-0.5">€{{ product.base_price }}</p>
          </div>
          <AppBadge :variant="categoryVariants[product.category] ?? 'gray'" dot size="sm">
            {{ PRODUCT_CATEGORIES[product.category]?.label }}
          </AppBadge>
        </div>
        <div class="mt-3 flex items-center gap-1.5 text-xs text-brand-400">
          <BookOpen class="w-3.5 h-3.5" />
          Edit recipe
        </div>
      </div>
    </div>

    <AppModal :open="showModal" size="lg" title="Recipe Builder" @close="showModal = false">
      <RecipeBuilder v-if="selected && showModal" :product="selected" />
      <template #footer>
        <AppButton variant="ghost" @click="showModal = false">Done</AppButton>
      </template>
    </AppModal>
  </div>
</template>
