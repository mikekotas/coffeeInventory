<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useProductsStore } from '@/stores/productsStore'
import { useInventoryStore } from '@/stores/inventoryStore'
import { useToast } from '@/composables/useToast'
import { useConfirm } from '@/composables/useConfirm'
import type { Product, Recipe } from '@/types'
import AppButton from '@/components/ui/AppButton.vue'
import AppEmptyState from '@/components/ui/AppEmptyState.vue'
import AppSpinner from '@/components/ui/AppSpinner.vue'
import { Plus, Trash2, BookOpen } from 'lucide-vue-next'

interface Props {
  product: Product
}
const props = defineProps<Props>()

const productsStore = useProductsStore()
const inventoryStore = useInventoryStore()
const toast = useToast()
const { confirm } = useConfirm()

const recipes = ref<Recipe[]>([])
const loading = ref(false)
const adding = ref(false)
const selectedInventoryId = ref('')
const selectedQty = ref<number>(1)
const updatingId = ref<string | null>(null)

onMounted(async () => {
  loading.value = true
  if (inventoryStore.items.length === 0) await inventoryStore.fetchAll()
  recipes.value = await productsStore.fetchRecipesForProduct(props.product.id)
  loading.value = false
})

const availableInventory = () =>
  inventoryStore.items.filter(i =>
    i.is_active && !recipes.value.some(r => r.inventory_id === i.id)
  )

async function addIngredient() {
  if (!selectedInventoryId.value || selectedQty.value <= 0) return
  adding.value = true
  try {
    const newRecipe = await productsStore.addRecipe(props.product.id, {
      inventory_id: selectedInventoryId.value,
      quantity_required: selectedQty.value,
    })
    recipes.value.push(newRecipe)
    selectedInventoryId.value = ''
    selectedQty.value = 1
    toast.success('Ingredient added')
  } catch {
    toast.error('Failed to add ingredient')
  } finally {
    adding.value = false
  }
}

async function updateQty(recipe: Recipe, qty: number) {
  updatingId.value = recipe.id
  try {
    const updated = await productsStore.updateRecipe(recipe.id, qty)
    const idx = recipes.value.findIndex(r => r.id === recipe.id)
    if (idx !== -1) recipes.value[idx] = updated
  } catch {
    toast.error('Failed to update')
  } finally {
    updatingId.value = null
  }
}

async function removeIngredient(recipe: Recipe) {
  const ok = await confirm({
    title: 'Remove Ingredient',
    message: `Remove ${recipe.inventory?.name} from ${props.product.name}?`,
    confirmLabel: 'Remove',
    danger: true,
  })
  if (!ok) return
  try {
    await productsStore.removeRecipe(recipe.id)
    recipes.value = recipes.value.filter(r => r.id !== recipe.id)
    toast.success('Ingredient removed')
  } catch {
    toast.error('Failed to remove')
  }
}
</script>

<template>
  <div class="space-y-4">
    <h3 class="text-sm font-semibold text-slate-300 flex items-center gap-2">
      <BookOpen class="w-4 h-4 text-brand-400" />
      Recipe for {{ product.name }}
    </h3>

    <AppSpinner v-if="loading" center />

    <div v-else>
      <!-- Existing ingredients -->
      <div v-if="recipes.length > 0" class="space-y-2 mb-4">
        <div
          v-for="r in recipes"
          :key="r.id"
          class="flex items-center gap-3 bg-slate-700/40 rounded-xl p-3"
        >
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-white">{{ r.inventory?.name }}</p>
            <p class="text-xs text-slate-500">{{ r.inventory?.unit }}</p>
          </div>
          <input
            :value="r.quantity_required"
            type="number"
            min="0"
            step="0.1"
            class="w-20 bg-slate-700 border border-slate-600 rounded-lg px-2 py-1 text-sm text-white text-center focus:outline-none focus:ring-1 focus:ring-brand-500"
            :disabled="updatingId === r.id"
            @change="updateQty(r, parseFloat(($event.target as HTMLInputElement).value))"
          />
          <span class="text-xs text-slate-500 w-10">{{ r.inventory?.unit }}</span>
          <button
            class="text-slate-500 hover:text-red-400 transition-colors"
            @click="removeIngredient(r)"
          >
            <Trash2 class="w-4 h-4" />
          </button>
        </div>
      </div>

      <AppEmptyState
        v-else
        title="No ingredients yet"
        description="Add inventory items to define this product's recipe"
      />

      <!-- Add new ingredient -->
      <div class="border-t border-slate-700 pt-3 mt-3">
        <p class="text-xs font-medium text-slate-400 mb-2">Add Ingredient</p>
        <div class="flex gap-2">
          <select
            v-model="selectedInventoryId"
            class="flex-1 bg-slate-700/60 border border-slate-600 rounded-xl text-slate-100 text-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="" disabled>Select ingredient...</option>
            <option
              v-for="inv in availableInventory()"
              :key="inv.id"
              :value="inv.id"
              class="bg-slate-800"
            >
              {{ inv.name }} ({{ inv.unit }})
            </option>
          </select>
          <input
            v-model="selectedQty"
            type="number"
            min="0"
            step="0.1"
            placeholder="Qty"
            class="w-20 bg-slate-700/60 border border-slate-600 rounded-xl text-slate-100 text-sm py-2 px-3 text-center focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          <AppButton size="sm" :loading="adding" :disabled="!selectedInventoryId" @click="addIngredient">
            <Plus class="w-4 h-4" />
          </AppButton>
        </div>
      </div>
    </div>
  </div>
</template>
