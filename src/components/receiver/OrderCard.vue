<script setup lang="ts">
import { computed } from 'vue'
import { useFormatters } from '@/composables/useFormatters'
import AppButton from '@/components/ui/AppButton.vue'
import { Banknote, CreditCard, MapPin, ShoppingBag, CheckCircle } from 'lucide-vue-next'
import type { Sale } from '@/types'

const props = defineProps<{
  sale: Sale
  completing: boolean
}>()

const emit = defineEmits<{
  complete: [saleId: string]
}>()

const { formatCurrency, formatRelative } = useFormatters()

const isCompleted = computed(() => props.sale.completed_at !== null)

const saleNumber = computed(() => props.sale.id.slice(-6).toUpperCase())
</script>

<template>
  <div
    :class="[
      'rounded-xl border transition-all',
      isCompleted
        ? 'bg-slate-900/40 border-slate-800/50 opacity-60'
        : 'bg-slate-800 border-slate-700 shadow-lg shadow-slate-950/40',
    ]"
  >
    <!-- Card header -->
    <div class="flex items-center justify-between px-4 pt-3 pb-2 border-b border-slate-700/50">
      <div class="flex items-center gap-2">
        <span class="text-xs font-mono font-bold text-amber-400">#{{ saleNumber }}</span>
        <!-- Table / Takeaway badge -->
        <span
          v-if="sale.sale_type === 'table'"
          class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/15 text-amber-300"
        >
          <MapPin class="w-2.5 h-2.5" />
          Table {{ sale.table_identifier }}
        </span>
        <span
          v-else
          class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-700 text-slate-400"
        >
          <ShoppingBag class="w-2.5 h-2.5" />
          Takeaway
        </span>
      </div>

      <div class="flex items-center gap-2">
        <!-- Payment method icon -->
        <span class="text-slate-500" :title="sale.payment_method === 'card' ? 'Card' : 'Cash'">
          <CreditCard v-if="sale.payment_method === 'card'" class="w-3.5 h-3.5 text-blue-400" />
          <Banknote v-else class="w-3.5 h-3.5 text-emerald-400" />
        </span>
        <!-- Time -->
        <span class="text-[10px] text-slate-500">
          {{ isCompleted ? formatRelative(sale.completed_at!) : formatRelative(sale.created_at) }}
        </span>
      </div>
    </div>

    <!-- Items list -->
    <div class="px-4 py-2 space-y-1">
      <div
        v-for="item in sale.sale_items"
        :key="item.id"
        class="flex items-center justify-between"
      >
        <span class="text-sm text-white">
          <span class="font-semibold text-amber-400">{{ item.qty_sold }}×</span>
          {{ item.product?.name ?? 'Unknown' }}
        </span>
        <span class="text-xs text-slate-400">{{ formatCurrency(item.unit_price * item.qty_sold) }}</span>
      </div>
    </div>

    <!-- Card footer -->
    <div class="flex items-center justify-between px-4 pb-3 pt-2 border-t border-slate-700/50">
      <div>
        <p class="text-[10px] text-slate-500">By {{ sale.profile?.full_name ?? '—' }}</p>
        <p class="text-sm font-bold text-white">{{ formatCurrency(sale.total_amount) }}</p>
      </div>

      <!-- Mark complete button -->
      <AppButton
        v-if="!isCompleted"
        size="sm"
        variant="primary"
        :loading="completing"
        @click="emit('complete', sale.id)"
      >
        Done
      </AppButton>

      <!-- Completed indicator -->
      <div v-else class="flex items-center gap-1 text-emerald-400">
        <CheckCircle class="w-4 h-4" />
        <span class="text-xs font-medium">Done</span>
      </div>
    </div>
  </div>
</template>
