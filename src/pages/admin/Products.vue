<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useProductsStore } from '@/stores/productsStore'
import { useToast } from '@/composables/useToast'
import { useConfirm } from '@/composables/useConfirm'
import { useI18n } from 'vue-i18n'
import type { Product, ProductForm } from '@/types'
import { PRODUCT_CATEGORIES } from '@/lib/constants'
import { useFormatters } from '@/composables/useFormatters'
import AppCard from '@/components/ui/AppCard.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppModal from '@/components/ui/AppModal.vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import AppSpinner from '@/components/ui/AppSpinner.vue'
import AppEmptyState from '@/components/ui/AppEmptyState.vue'
import RecipeBuilder from '@/components/recipes/RecipeBuilder.vue'
import { useProductName } from '@/composables/useProductName'
import { Plus, Pencil, Trash2, BookOpen } from 'lucide-vue-next'

const store = useProductsStore()
const toast = useToast()
const { confirm } = useConfirm()
const { formatCurrency } = useFormatters()
const { t } = useI18n()
const { getName } = useProductName()

const showProductModal = ref(false)
const showRecipeModal = ref(false)
const editProduct = ref<Product | null>(null)
const recipeProduct = ref<Product | null>(null)
const saving = ref(false)

const categoryOptions = computed(() =>
  Object.keys(PRODUCT_CATEGORIES).map(key => ({ value: key, label: t(`categories.product.${key}`) }))
)

const categoryVariants: Record<string, 'amber' | 'yellow' | 'purple' | 'blue' | 'green' | 'gray'> = {
  coffee: 'amber', beer: 'yellow', alcohol: 'purple', soft_drink: 'blue', food: 'green', other: 'gray',
}

const form = ref<ProductForm>({ name: '', name_el: '', base_price: 0, category: 'coffee', is_active: true })

onMounted(() => store.fetchAll())

function openAdd() {
  editProduct.value = null
  form.value = { name: '', name_el: '', base_price: 0, category: 'coffee', is_active: true }
  showProductModal.value = true
}

function openEdit(product: Product) {
  editProduct.value = product
  form.value = { name: product.name, name_el: product.name_el ?? '', base_price: product.base_price, category: product.category, is_active: product.is_active }
  showProductModal.value = true
}

function openRecipe(product: Product) {
  recipeProduct.value = product
  showRecipeModal.value = true
}

async function handleSubmit() {
  saving.value = true
  try {
    if (editProduct.value) {
      await store.update(editProduct.value.id, form.value)
      toast.success(t('products.productUpdated'))
    } else {
      await store.create(form.value)
      toast.success(t('products.productAdded'))
    }
    showProductModal.value = false
  } catch (err: unknown) {
    toast.error(t('products.failed'), err instanceof Error ? err.message : '')
  } finally {
    saving.value = false
  }
}

async function handleDelete(product: Product) {
  const ok = await confirm({
    title: t('products.deactivateProduct'),
    message: t('products.deactivateConfirm', { name: getName(product) }),
    confirmLabel: t('products.deactivateBtn'),
    danger: true,
  })
  if (!ok) return
  await store.remove(product.id)
  toast.success(t('products.productDeactivated'))
}

const activeProducts = () => store.products.filter(p => p.is_active)
</script>

<template>
  <div class="space-y-4">
    <div class="flex justify-end">
      <AppButton @click="openAdd"><Plus class="w-4 h-4" /> {{ $t('products.addProduct') }}</AppButton>
    </div>

    <AppCard padding="none">
      <AppSpinner v-if="store.loading" center />
      <AppEmptyState
        v-else-if="activeProducts().length === 0"
        :title="$t('products.noProducts')"
        :description="$t('products.noProductsDesc')"
      >
        <template #action>
          <AppButton size="sm" @click="openAdd"><Plus class="w-4 h-4" /> {{ $t('products.addProduct') }}</AppButton>
        </template>
      </AppEmptyState>
      <div v-else class="divide-y divide-slate-700/50">
        <div
          v-for="product in activeProducts()"
          :key="product.id"
          class="flex items-center gap-3 px-4 py-3"
        >
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2">
              <p class="text-sm font-medium text-white truncate">{{ getName(product) }}</p>
              <AppBadge :variant="categoryVariants[product.category] ?? 'gray'" dot>
                {{ $t(`categories.product.${product.category}`) }}
              </AppBadge>
            </div>
            <p class="text-xs text-slate-400 mt-0.5">{{ formatCurrency(product.base_price) }}</p>
          </div>
          <div class="flex gap-1 shrink-0">
            <button
              class="p-1.5 rounded-lg text-slate-400 hover:text-brand-400 hover:bg-slate-700 transition-colors"
              :title="$t('products.manageRecipe')"
              @click="openRecipe(product)"
            >
              <BookOpen class="w-4 h-4" />
            </button>
            <button
              class="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
              @click="openEdit(product)"
            >
              <Pencil class="w-4 h-4" />
            </button>
            <button
              class="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-700 transition-colors"
              @click="handleDelete(product)"
            >
              <Trash2 class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </AppCard>

    <!-- Product Modal -->
    <AppModal :open="showProductModal" :title="editProduct ? $t('products.editProduct') : $t('products.addProduct')" @close="showProductModal = false">
      <form class="space-y-4" @submit.prevent="handleSubmit">
        <AppInput v-model="form.name" :label="$t('products.productName')" :placeholder="$t('products.productNamePlaceholder')" required />
        <AppInput :model-value="form.name_el ?? ''" @update:model-value="form.name_el = ($event as string)" :label="$t('products.greekName')" :placeholder="$t('products.greekNamePlaceholder')" />
        <div class="grid grid-cols-2 gap-3">
          <AppInput v-model="form.base_price" type="number" :label="$t('products.price')" prefix="€" required />
          <AppSelect v-model="form.category" :options="categoryOptions" :label="$t('products.category')" required />
        </div>
        <div class="flex items-center gap-2">
          <input id="active" v-model="form.is_active" type="checkbox" class="w-4 h-4 rounded bg-slate-700 border-slate-600 text-brand-600 focus:ring-brand-500" />
          <label for="active" class="text-sm text-slate-300">{{ $t('products.activeInPOS') }}</label>
        </div>
        <div class="flex gap-2 pt-1">
          <AppButton variant="ghost" type="button" full-width @click="showProductModal = false">{{ $t('common.cancel') }}</AppButton>
          <AppButton type="submit" :loading="saving" full-width>{{ editProduct ? $t('common.update') : $t('common.add') }}</AppButton>
        </div>
      </form>
    </AppModal>

    <!-- Recipe Modal -->
    <AppModal :open="showRecipeModal" size="lg" :title="$t('recipes.recipeBuilder')" @close="showRecipeModal = false">
      <RecipeBuilder v-if="recipeProduct && showRecipeModal" :product="recipeProduct" />
    </AppModal>
  </div>
</template>
