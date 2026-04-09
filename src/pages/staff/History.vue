<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { useSalesStore } from '@/stores/salesStore'
import { useAuthStore } from '@/stores/authStore'
import { useFormatters } from '@/composables/useFormatters'
import AppCard from '@/components/ui/AppCard.vue'
import AppStatCard from '@/components/ui/AppStatCard.vue'
import AppSpinner from '@/components/ui/AppSpinner.vue'
import AppEmptyState from '@/components/ui/AppEmptyState.vue'
import { TrendingUp, ShoppingBag, Banknote, CreditCard } from 'lucide-vue-next'

const salesStore = useSalesStore()
const authStore = useAuthStore()
const { formatCurrency, formatDate } = useFormatters()

onMounted(async () => {
  if (authStore.profile) {
    await salesStore.fetchMine(authStore.profile.id)
    await salesStore.fetchShiftSales(authStore.profile.id)
  }
})

const totalRevenue = computed(() =>
  salesStore.mySales.reduce((sum, s) => sum + s.total_amount, 0)
)
</script>

<template>
  <div class="p-4 space-y-4">
    <!-- Stats -->
    <div class="grid grid-cols-2 gap-3">
      <AppStatCard
        title="My Total Revenue"
        :value="formatCurrency(totalRevenue)"
        icon-bg="bg-brand-500/20"
      >
        <template #icon><TrendingUp class="w-5 h-5 text-brand-400" /></template>
      </AppStatCard>
      <AppStatCard
        title="My Sales"
        :value="salesStore.mySales.length"
        icon-bg="bg-blue-500/20"
      >
        <template #icon><ShoppingBag class="w-5 h-5 text-blue-400" /></template>
      </AppStatCard>
    </div>

    <!-- Shift History -->
    <div v-if="salesStore.shiftSales.length > 0">
      <h3 class="text-sm font-semibold text-slate-300 mb-2">My Shifts</h3>
      <div class="space-y-2">
        <div
          v-for="shift in salesStore.shiftSales"
          :key="shift.shift_id"
          class="bg-slate-800 border border-slate-700/50 rounded-xl px-4 py-3 flex items-center justify-between"
        >
          <div>
            <p class="text-sm text-white">{{ formatDate(shift.started_at) }}</p>
            <p class="text-xs text-slate-500">{{ shift.sale_count }} sales</p>
          </div>
          <p class="text-sm font-semibold text-white">{{ formatCurrency(Number(shift.total_revenue)) }}</p>
        </div>
      </div>
    </div>

    <!-- My Sales -->
    <div>
      <h3 class="text-sm font-semibold text-slate-300 mb-2">My Sales History</h3>
      <AppCard padding="none">
        <AppSpinner v-if="salesStore.loading" center />
        <AppEmptyState
          v-else-if="salesStore.mySales.length === 0"
          title="No sales yet"
          description="Your sales history will appear here"
        />
        <div v-else class="divide-y divide-slate-700/50">
          <div
            v-for="sale in salesStore.mySales"
            :key="sale.id"
            class="flex items-start gap-3 px-4 py-3"
          >
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2">
                <p class="text-xs text-slate-400">{{ formatDate(sale.created_at) }}</p>
                <span v-if="sale.sale_type === 'table'" class="text-[10px] font-semibold tracking-wider uppercase text-brand-400 bg-brand-500/10 px-1.5 py-0.5 rounded">{{ sale.table_identifier }}</span>
                <span v-else-if="sale.sale_type === 'takeaway'" class="text-[10px] font-semibold tracking-wider uppercase text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded">Takeaway</span>
              </div>
              <p class="text-xs text-slate-500 mt-0.5 truncate">
                {{ sale.sale_items?.map(si => si.product?.name).join(', ') || '—' }}
              </p>
            </div>
            <div class="text-right flex items-center gap-1.5 shrink-0">
              <Banknote v-if="sale.payment_method === 'cash'" class="w-4 h-4 text-emerald-400" />
              <CreditCard v-else-if="sale.payment_method === 'card'" class="w-4 h-4 text-blue-400" />
              <p class="text-sm font-semibold text-white">{{ formatCurrency(sale.total_amount) }}</p>
            </div>
          </div>
        </div>
      </AppCard>
    </div>
  </div>
</template>
