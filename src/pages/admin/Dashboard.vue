<script setup lang="ts">
import { onMounted, computed } from 'vue'
import { useSalesStore } from '@/stores/salesStore'
import { useInventoryStore } from '@/stores/inventoryStore'
import { useNotificationsStore } from '@/stores/notificationsStore'
import { useOrdersStore } from '@/stores/ordersStore'
import { useAuthStore } from '@/stores/authStore'
import { useAdminRealtime } from '@/composables/useRealtime'
import { useFormatters } from '@/composables/useFormatters'
import AppStatCard from '@/components/ui/AppStatCard.vue'
import AppCard from '@/components/ui/AppCard.vue'
import AppSpinner from '@/components/ui/AppSpinner.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import RevenueChart from '@/components/charts/RevenueChart.vue'
import TopProductsChart from '@/components/charts/TopProductsChart.vue'
import ThresholdBadge from '@/components/inventory/ThresholdBadge.vue'
import StockBar from '@/components/inventory/StockBar.vue'
import {
  TrendingUp, Package, AlertTriangle, ClipboardList, Euro,
} from 'lucide-vue-next'

const salesStore = useSalesStore()
const inventoryStore = useInventoryStore()
const notificationsStore = useNotificationsStore()
const ordersStore = useOrdersStore()
const authStore = useAuthStore()
const { formatCurrency, formatRelative } = useFormatters()

useAdminRealtime()

onMounted(async () => {
  await Promise.all([
    salesStore.fetchAll(30),
    salesStore.fetchDailyRevenue(30),
    salesStore.fetchTopProducts(30),
    inventoryStore.fetchAll(),
    notificationsStore.fetchAll(),
    ordersStore.fetchDraftOrder(),
  ])
})

const firstName = computed(() => authStore.profile?.full_name?.split(' ')[0] ?? 'Admin')
const weekRevenue = computed(() => {
  const oneWeekAgo = new Date()
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)
  return salesStore.sales
    .filter(s => new Date(s.created_at) >= oneWeekAgo)
    .reduce((sum, s) => sum + s.total_amount, 0)
})
</script>

<template>
  <div class="space-y-6">
    <!-- Greeting -->
    <div>
      <h2 class="text-xl font-bold text-white">{{ $t('dashboard.greeting', { name: firstName }) }}</h2>
      <p class="text-sm text-slate-500">{{ $t('dashboard.subtitle') }}</p>
    </div>

    <!-- KPI Cards -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <AppStatCard
        :title="$t('dashboard.todayRevenue')"
        :value="formatCurrency(salesStore.todayRevenue)"
        :subtitle="$t('dashboard.salesToday')"
        icon-bg="bg-brand-500/20"
      >
        <template #icon><Euro class="w-5 h-5 text-brand-400" /></template>
      </AppStatCard>

      <AppStatCard
        :title="$t('dashboard.thisWeek')"
        :value="formatCurrency(weekRevenue)"
        :subtitle="$t('dashboard.last7Days')"
        icon-bg="bg-emerald-500/20"
      >
        <template #icon><TrendingUp class="w-5 h-5 text-emerald-400" /></template>
      </AppStatCard>

      <AppStatCard
        :title="$t('dashboard.lowStockItems')"
        :value="inventoryStore.lowStockItems.length"
        :subtitle="$t('dashboard.criticalCount', { count: inventoryStore.criticalItems.length })"
        icon-bg="bg-amber-500/20"
      >
        <template #icon><Package class="w-5 h-5 text-amber-400" /></template>
      </AppStatCard>

      <AppStatCard
        :title="$t('dashboard.pendingOrders')"
        :value="ordersStore.draftItemCount"
        :subtitle="$t('dashboard.itemsToOrder')"
        icon-bg="bg-blue-500/20"
      >
        <template #icon><ClipboardList class="w-5 h-5 text-blue-400" /></template>
      </AppStatCard>
    </div>

    <div class="grid lg:grid-cols-3 gap-4">
      <!-- Revenue Chart -->
      <AppCard class="lg:col-span-2" padding="md">
        <div class="flex items-center justify-between mb-4">
          <h3 class="font-semibold text-white text-sm">{{ $t('dashboard.revenue30d') }}</h3>
        </div>
        <AppSpinner v-if="salesStore.loading" center />
        <RevenueChart v-else :data="salesStore.dailyRevenue" />
      </AppCard>

      <!-- Top Products -->
      <AppCard padding="md">
        <h3 class="font-semibold text-white text-sm mb-4">{{ $t('dashboard.topProducts') }}</h3>
        <AppSpinner v-if="salesStore.loading" center />
        <TopProductsChart v-else :data="salesStore.topProducts" />
      </AppCard>
    </div>

    <div class="grid lg:grid-cols-2 gap-4">
      <!-- Critical Stock -->
      <AppCard padding="none">
        <div class="flex items-center justify-between px-4 pt-4 pb-3 border-b border-slate-700">
          <h3 class="font-semibold text-white text-sm">{{ $t('dashboard.stockAlerts') }}</h3>
          <AppBadge v-if="inventoryStore.criticalItems.length > 0" variant="red" dot>
            {{ $t('dashboard.criticalCount', { count: inventoryStore.criticalItems.length }) }}
          </AppBadge>
        </div>
        <div v-if="inventoryStore.loading" class="p-6"><AppSpinner center /></div>
        <div v-else-if="inventoryStore.lowStockItems.length === 0" class="px-4 py-8 text-center text-sm text-slate-500">
          {{ $t('dashboard.allStockOk') }}
        </div>
        <div v-else class="divide-y divide-slate-700/50">
          <div
            v-for="item in inventoryStore.lowStockItems.slice(0, 6)"
            :key="item.id"
            class="px-4 py-3"
          >
            <div class="flex items-center justify-between mb-1.5">
              <p class="text-sm font-medium text-white truncate">{{ item.name }}</p>
              <ThresholdBadge :item="item" :show-qty="false" />
            </div>
            <StockBar :item="item" />
            <p class="text-xs text-slate-500 mt-1">
              {{ $t('dashboard.warningNote', { qty: item.stock_qty, threshold: item.warning_threshold, unit: item.unit }) }}
            </p>
          </div>
        </div>
      </AppCard>

      <!-- Recent Notifications -->
      <AppCard padding="none">
        <div class="flex items-center justify-between px-4 pt-4 pb-3 border-b border-slate-700">
          <h3 class="font-semibold text-white text-sm">{{ $t('dashboard.recentAlerts') }}</h3>
          <button
            v-if="notificationsStore.unreadCount > 0"
            class="text-xs text-brand-400 hover:text-brand-300"
            @click="notificationsStore.markAllRead()"
          >
            {{ $t('dashboard.markAllRead') }}
          </button>
        </div>
        <div v-if="notificationsStore.loading" class="p-6"><AppSpinner center /></div>
        <div v-else-if="notificationsStore.notifications.length === 0" class="px-4 py-8 text-center text-sm text-slate-500">
          {{ $t('dashboard.noNotifications') }}
        </div>
        <div v-else class="divide-y divide-slate-700/50 max-h-80 overflow-y-auto">
          <div
            v-for="n in notificationsStore.notifications.slice(0, 8)"
            :key="n.id"
            :class="['px-4 py-3 flex items-start gap-3', n.status === 'unread' ? '' : 'opacity-60']"
          >
            <AlertTriangle
              :class="['w-4 h-4 shrink-0 mt-0.5', n.severity === 'critical' ? 'text-red-400' : 'text-amber-400']"
            />
            <div class="flex-1 min-w-0">
              <p class="text-xs text-slate-200 leading-snug">{{ n.message }}</p>
              <p class="text-xs text-slate-500 mt-0.5">{{ formatRelative(n.created_at) }}</p>
            </div>
            <div v-if="n.status === 'unread'" class="w-1.5 h-1.5 rounded-full bg-brand-500 shrink-0 mt-1.5" />
          </div>
        </div>
      </AppCard>
    </div>
  </div>
</template>
