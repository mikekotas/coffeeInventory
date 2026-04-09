<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useInventoryStore } from '@/stores/inventoryStore'
import { useOrdersStore } from '@/stores/ordersStore'
import AppTabs from '@/components/ui/AppTabs.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppSpinner from '@/components/ui/AppSpinner.vue'
import AppEmptyState from '@/components/ui/AppEmptyState.vue'
import ChecklistItem from '@/components/checklist/ChecklistItem.vue'
import OrderDraftPanel from '@/components/checklist/OrderDraftPanel.vue'
import { getStockStatus } from '@/types'
import { ClipboardList, Package } from 'lucide-vue-next'

const inventoryStore = useInventoryStore()
const ordersStore = useOrdersStore()

const activeTab = ref('real_stuff')
const showOrderPanel = ref(false)

onMounted(async () => {
  await inventoryStore.fetchAll()
  await ordersStore.fetchDraftOrder()
})

const tabs = computed(() => [
  { key: 'real_stuff', label: 'Real Stuff', count: inventoryStore.realStuff.length },
  { key: 'peripherals', label: 'Peripherals', count: inventoryStore.peripherals.length },
])

const currentList = computed(() =>
  activeTab.value === 'real_stuff' ? inventoryStore.realStuff : inventoryStore.peripherals
)

// Sort: critical → warning → ok
const sortedList = computed(() => {
  const order = { out: 0, critical: 1, warning: 2, ok: 3 }
  return [...currentList.value].sort((a, b) => order[getStockStatus(a)] - order[getStockStatus(b)])
})
</script>

<template>
  <div>
    <!-- Header bar -->
    <div class="px-4 pt-4 pb-3 flex items-center justify-between">
      <AppTabs :tabs="tabs" v-model="activeTab" />
      <AppButton
        size="sm"
        variant="outline"
        @click="showOrderPanel = true"
      >
        <ClipboardList class="w-4 h-4" />
        Order
        <span
          v-if="ordersStore.draftItemCount > 0"
          class="bg-brand-500 text-white text-xs font-bold rounded-full px-1.5 py-0.5 min-w-[18px] text-center"
        >
          {{ ordersStore.draftItemCount }}
        </span>
      </AppButton>
    </div>

    <!-- Checklist -->
    <div v-if="inventoryStore.loading" class="p-8"><AppSpinner center /></div>
    <div v-else-if="sortedList.length === 0">
      <AppEmptyState title="No items in this category">
        <template #icon><Package class="w-8 h-8 text-slate-500" /></template>
      </AppEmptyState>
    </div>
    <div v-else class="bg-slate-800 border border-slate-700/50 mx-4 rounded-2xl overflow-hidden">
      <ChecklistItem
        v-for="item in sortedList"
        :key="item.id"
        :item="item"
      />
    </div>

    <!-- Draft Order Panel -->
    <OrderDraftPanel :open="showOrderPanel" @close="showOrderPanel = false" />
  </div>
</template>
