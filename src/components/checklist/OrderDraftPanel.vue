<script setup lang="ts">
import { useOrdersStore } from '@/stores/ordersStore'
import AppDrawer from '@/components/ui/AppDrawer.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppEmptyState from '@/components/ui/AppEmptyState.vue'
import AppSpinner from '@/components/ui/AppSpinner.vue'
import { Minus, Plus, Trash2, ClipboardList, Cpu } from 'lucide-vue-next'

interface Props {
  open: boolean
}
defineProps<Props>()
const emit = defineEmits<{ close: [] }>()

const ordersStore = useOrdersStore()
</script>

<template>
  <AppDrawer :open="open" title="Draft Order" side="bottom" @close="emit('close')">
    <div v-if="ordersStore.loading" class="p-8">
      <AppSpinner center />
    </div>

    <div v-else-if="ordersStore.draftItems.length === 0" class="py-8">
      <AppEmptyState title="No items in order" description="Add items from the checklist below">
        <template #icon><ClipboardList class="w-8 h-8 text-slate-500" /></template>
      </AppEmptyState>
    </div>

    <div v-else class="p-4 space-y-2">
      <div
        v-for="oi in ordersStore.draftItems"
        :key="oi.id"
        class="flex items-center gap-3 bg-slate-700/40 rounded-xl p-3"
      >
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-1.5">
            <p class="text-sm font-medium text-white truncate">{{ oi.inventory?.name }}</p>
            <span
              v-if="oi.source === 'auto_threshold'"
              class="inline-flex items-center gap-1 text-xs text-brand-400"
            >
              <Cpu class="w-3 h-3" />Auto
            </span>
          </div>
          <p class="text-xs text-slate-500">{{ oi.inventory?.unit }}</p>
        </div>

        <!-- Qty controls -->
        <div class="flex items-center gap-1.5">
          <button
            class="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-600 hover:bg-slate-500 text-white transition-colors"
            @click="ordersStore.updateItemQty(oi.id, oi.quantity_requested - 1)"
          >
            <Minus class="w-3.5 h-3.5" />
          </button>
          <span class="w-8 text-center text-sm font-bold text-white">{{ oi.quantity_requested }}</span>
          <button
            class="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-600 hover:bg-slate-500 text-white transition-colors"
            @click="ordersStore.updateItemQty(oi.id, oi.quantity_requested + 1)"
          >
            <Plus class="w-3.5 h-3.5" />
          </button>
        </div>

        <button
          class="text-slate-500 hover:text-red-400 transition-colors shrink-0"
          @click="ordersStore.removeItem(oi.id)"
        >
          <Trash2 class="w-4 h-4" />
        </button>
      </div>
    </div>

    <template #footer>
      <div class="p-4">
        <p class="text-xs text-slate-500 mb-3 text-center">
          {{ ordersStore.draftItemCount }} item(s) pending order · Admin will review and finalize
        </p>
        <AppButton variant="ghost" full-width @click="emit('close')">Close</AppButton>
      </div>
    </template>
  </AppDrawer>
</template>
