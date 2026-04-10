<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useInventoryStore } from '@/stores/inventoryStore'
import { useToast } from '@/composables/useToast'
import { useConfirm } from '@/composables/useConfirm'
import { useI18n } from 'vue-i18n'
import type { InventoryItem, InventoryItemForm, InventoryCategory } from '@/types'
import AppCard from '@/components/ui/AppCard.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppModal from '@/components/ui/AppModal.vue'
import AppSpinner from '@/components/ui/AppSpinner.vue'
import AppTabs from '@/components/ui/AppTabs.vue'
import AppEmptyState from '@/components/ui/AppEmptyState.vue'
import InventoryForm from '@/components/inventory/InventoryForm.vue'
import ThresholdBadge from '@/components/inventory/ThresholdBadge.vue'
import StockBar from '@/components/inventory/StockBar.vue'
import { useProductName } from '@/composables/useProductName'
import { Plus, Pencil, Trash2, Search } from 'lucide-vue-next'

const store = useInventoryStore()
const toast = useToast()
const { confirm } = useConfirm()
const { t } = useI18n()
const { getName } = useProductName()

const activeTab = ref<InventoryCategory>('real_stuff')
const showModal = ref(false)
const editItem = ref<InventoryItem | null>(null)
const saving = ref(false)
const search = ref('')

const filteredItems = computed(() => {
  const list = activeTab.value === 'real_stuff' ? store.realStuff : store.peripherals
  if (!search.value) return list
  const q = search.value.toLowerCase()
  return list.filter(i =>
    i.name.toLowerCase().includes(q) ||
    (i.name_el && i.name_el.toLowerCase().includes(q))
  )
})

const tabs = computed(() => [
  { key: 'real_stuff', label: t('categories.inventory.real_stuff'), count: store.realStuff.length },
  { key: 'peripherals', label: t('categories.inventory.peripherals'), count: store.peripherals.length },
])

onMounted(() => store.fetchAll())

function openAdd() {
  editItem.value = null
  showModal.value = true
}

function openEdit(item: InventoryItem) {
  editItem.value = item
  showModal.value = true
}

async function handleSubmit(form: InventoryItemForm) {
  saving.value = true
  try {
    if (editItem.value) {
      await store.update(editItem.value.id, form)
      toast.success(t('inventory.itemUpdated'))
    } else {
      await store.create(form)
      toast.success(t('inventory.itemAdded'))
    }
    showModal.value = false
  } catch (err: unknown) {
    toast.error(t('inventory.saveFailed'), err instanceof Error ? err.message : '')
  } finally {
    saving.value = false
  }
}

async function handleDelete(item: InventoryItem) {
  const ok = await confirm({
    title: t('inventory.removeItem'),
    message: t('inventory.removeConfirmMsg', { name: item.name }),
    confirmLabel: t('inventory.deactivateBtn'),
    danger: true,
  })
  if (!ok) return
  try {
    await store.remove(item.id)
    toast.success(t('inventory.itemDeactivated'))
  } catch {
    toast.error(t('inventory.removeFailed'))
  }
}

async function handleStockUpdate(item: InventoryItem, newQty: number) {
  try {
    await store.updateStock(item.id, newQty)
    toast.success(t('inventory.stockUpdated'))
  } catch {
    toast.error(t('inventory.stockUpdateFailed'))
  }
}
</script>

<template>
  <div class="space-y-4">
    <!-- Toolbar -->
    <div class="flex flex-col sm:flex-row sm:items-center gap-3">
      <div class="relative flex-1">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          v-model="search"
          :placeholder="$t('inventory.searchPlaceholder')"
          class="w-full pl-9 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>
      <AppButton @click="openAdd">
        <Plus class="w-4 h-4" /> {{ $t('inventory.addItem') }}
      </AppButton>
    </div>

    <!-- Tabs -->
    <AppTabs :tabs="tabs" v-model="activeTab" />

    <!-- Table -->
    <AppCard padding="none">
      <AppSpinner v-if="store.loading" center />
      <AppEmptyState
        v-else-if="filteredItems.length === 0"
        :title="$t('inventory.noItemsFound')"
        :description="search ? $t('inventory.emptySearch') : $t('inventory.emptyFirst')"
      >
        <template #action>
          <AppButton v-if="!search" size="sm" @click="openAdd"><Plus class="w-4 h-4" /> {{ $t('inventory.addItem') }}</AppButton>
        </template>
      </AppEmptyState>

      <div v-else class="divide-y divide-slate-700/50">
        <div
          v-for="item in filteredItems"
          :key="item.id"
          class="flex items-center gap-3 px-4 py-3"
        >
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-1">
              <p class="text-sm font-medium text-white truncate">{{ getName(item) }}</p>
              <ThresholdBadge :item="item" :show-qty="false" />
            </div>
            <StockBar :item="item" />
            <div class="flex items-center gap-3 mt-1">
              <p class="text-xs text-slate-500">{{ item.stock_qty }} {{ t(`units.inventory.${item.unit}`) }}</p>
              <p class="text-xs text-slate-600">⚠ {{ item.warning_threshold }} • 🔴 {{ item.critical_threshold }}</p>
            </div>
          </div>

          <!-- Inline stock edit -->
          <div class="flex items-center gap-1.5 shrink-0">
            <input
              :value="item.stock_qty"
              type="number"
              min="0"
              class="w-16 bg-slate-700 border border-slate-600 rounded-lg px-2 py-1 text-xs text-white text-center focus:outline-none focus:ring-1 focus:ring-brand-500"
              @change="handleStockUpdate(item, parseFloat(($event.target as HTMLInputElement).value))"
            />
            <span class="text-xs text-slate-500">{{ t(`units.inventory.${item.unit}`) }}</span>
          </div>

          <!-- Actions -->
          <div class="flex gap-1 shrink-0">
            <button
              class="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
              @click="openEdit(item)"
            >
              <Pencil class="w-4 h-4" />
            </button>
            <button
              class="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-700 transition-colors"
              @click="handleDelete(item)"
            >
              <Trash2 class="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </AppCard>

    <!-- Modal -->
    <AppModal
      :open="showModal"
      :title="editItem ? $t('inventory.editItem') : $t('inventory.addItem')"
      @close="showModal = false"
    >
      <InventoryForm
        :item="editItem"
        :loading="saving"
        @submit="handleSubmit"
        @cancel="showModal = false"
      />
    </AppModal>
  </div>
</template>
