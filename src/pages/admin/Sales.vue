<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useSalesStore } from '@/stores/salesStore'
import { useFormatters } from '@/composables/useFormatters'
import AppCard from '@/components/ui/AppCard.vue'
import AppStatCard from '@/components/ui/AppStatCard.vue'
import AppSpinner from '@/components/ui/AppSpinner.vue'
import AppTabs from '@/components/ui/AppTabs.vue'
import AppEmptyState from '@/components/ui/AppEmptyState.vue'
import RevenueChart from '@/components/charts/RevenueChart.vue'
import SalesShiftChart from '@/components/charts/SalesShiftChart.vue'
import TopProductsChart from '@/components/charts/TopProductsChart.vue'
import { BarChart3, TrendingUp, ShoppingBag } from 'lucide-vue-next'

const store = useSalesStore()
const { formatCurrency, formatDate } = useFormatters()

const activeTab = ref('overview')
const tabs = [
  { key: 'overview', label: 'Overview' },
  { key: 'shifts', label: 'By Shift' },
  { key: 'transactions', label: 'Transactions' },
]

onMounted(async () => {
  await Promise.all([
    store.fetchAll(30),
    store.fetchDailyRevenue(30),
    store.fetchShiftSales(),
    store.fetchTopProducts(30),
  ])
})

const totalTransactions = () => store.sales.length
const avgOrder = () => store.sales.length > 0 ? store.totalRevenue / store.sales.length : 0
</script>

<template>
  <div class="space-y-4">
    <!-- KPI Row -->
    <div class="grid grid-cols-2 lg:grid-cols-3 gap-3">
      <AppStatCard title="30-Day Revenue" :value="formatCurrency(store.totalRevenue)" icon-bg="bg-brand-500/20">
        <template #icon><TrendingUp class="w-5 h-5 text-brand-400" /></template>
      </AppStatCard>
      <AppStatCard title="Transactions" :value="totalTransactions()" subtitle="Last 30 days" icon-bg="bg-blue-500/20">
        <template #icon><ShoppingBag class="w-5 h-5 text-blue-400" /></template>
      </AppStatCard>
      <AppStatCard title="Avg. Order" :value="formatCurrency(avgOrder())" icon-bg="bg-emerald-500/20">
        <template #icon><BarChart3 class="w-5 h-5 text-emerald-400" /></template>
      </AppStatCard>
    </div>

    <AppTabs :tabs="tabs" v-model="activeTab" />

    <!-- Overview -->
    <div v-if="activeTab === 'overview'" class="space-y-4">
      <AppCard padding="md">
        <h3 class="font-semibold text-white text-sm mb-4">Daily Revenue (30 days)</h3>
        <AppSpinner v-if="store.loading" center />
        <RevenueChart v-else :data="store.dailyRevenue" />
      </AppCard>
      <AppCard padding="md">
        <h3 class="font-semibold text-white text-sm mb-4">Top Products by Revenue</h3>
        <AppSpinner v-if="store.loading" center />
        <TopProductsChart v-else :data="store.topProducts" />
      </AppCard>
    </div>

    <!-- Shifts -->
    <div v-else-if="activeTab === 'shifts'" class="space-y-4">
      <AppCard padding="md">
        <h3 class="font-semibold text-white text-sm mb-4">Revenue per Shift</h3>
        <AppSpinner v-if="store.loading" center />
        <SalesShiftChart v-else :data="store.shiftSales" />
      </AppCard>
      <AppCard padding="none">
        <div class="divide-y divide-slate-700/50">
          <div
            v-for="shift in store.shiftSales.slice(0, 20)"
            :key="shift.shift_id"
            class="flex items-center gap-3 px-4 py-3"
          >
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-white">{{ shift.staff_name }}</p>
              <p class="text-xs text-slate-500">{{ formatDate(shift.started_at) }}</p>
            </div>
            <div class="text-right">
              <p class="text-sm font-semibold text-white">{{ formatCurrency(Number(shift.total_revenue)) }}</p>
              <p class="text-xs text-slate-500">{{ shift.sale_count }} sales</p>
            </div>
          </div>
        </div>
      </AppCard>
    </div>

    <!-- Transactions -->
    <div v-else>
      <AppCard padding="none">
        <AppSpinner v-if="store.loading" center />
        <AppEmptyState v-else-if="store.sales.length === 0" title="No sales yet" />
        <div v-else class="divide-y divide-slate-700/50">
          <div
            v-for="sale in store.sales.slice(0, 50)"
            :key="sale.id"
            class="flex items-center gap-3 px-4 py-3"
          >
            <div class="flex-1 min-w-0">
              <p class="text-sm text-white">{{ sale.profile?.full_name ?? '—' }}</p>
              <p class="text-xs text-slate-500">{{ formatDate(sale.created_at) }}</p>
            </div>
            <div class="text-right">
              <p class="text-sm font-semibold text-white">{{ formatCurrency(sale.total_amount) }}</p>
              <p class="text-xs text-slate-500">{{ sale.sale_items?.length ?? 0 }} items</p>
            </div>
          </div>
        </div>
      </AppCard>
    </div>
  </div>
</template>
