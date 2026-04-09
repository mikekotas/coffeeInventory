<script setup lang="ts">
import { computed } from 'vue'
import { Bar } from 'vue-chartjs'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip } from 'chart.js'
import type { InventoryItem } from '@/types'
import { getStockStatus } from '@/types'
import { CHART_COLORS } from '@/lib/constants'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip)

interface Props {
  items: InventoryItem[]
}
const props = defineProps<Props>()

// Show top 12 lowest items
const lowItems = computed(() =>
  [...props.items]
    .filter(i => i.is_active)
    .sort((a, b) => (a.stock_qty / a.warning_threshold) - (b.stock_qty / b.warning_threshold))
    .slice(0, 12)
)

const statusColors: Record<string, string> = {
  ok: CHART_COLORS.success,
  warning: CHART_COLORS.warning,
  critical: CHART_COLORS.danger,
  out: '#475569',
}

const chartData = computed(() => ({
  labels: lowItems.value.map(i => `${i.name} (${i.unit})`),
  datasets: [
    {
      label: 'Stock',
      data: lowItems.value.map(i => i.stock_qty),
      backgroundColor: lowItems.value.map(i => statusColors[getStockStatus(i)]),
      borderRadius: 4,
    },
    {
      label: 'Warning',
      data: lowItems.value.map(i => i.warning_threshold),
      backgroundColor: 'rgba(245, 158, 11, 0.2)',
      borderColor: CHART_COLORS.warning,
      borderWidth: 1,
      borderRadius: 4,
      type: 'bar' as const,
    },
  ],
}))

const options = {
  indexAxis: 'y' as const,
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: true,
      labels: { color: '#94a3b8', font: { size: 11 }, boxWidth: 10 },
    },
    tooltip: {
      backgroundColor: '#1e293b',
      borderColor: '#334155',
      borderWidth: 1,
      titleColor: '#f1f5f9',
      bodyColor: '#94a3b8',
    },
  },
  scales: {
    x: {
      grid: { color: '#1e293b' },
      ticks: { color: '#64748b', font: { size: 10 } },
    },
    y: {
      grid: { display: false },
      ticks: { color: '#94a3b8', font: { size: 10 } },
    },
  },
}
</script>

<template>
  <div :style="{ height: `${Math.max(200, lowItems.length * 36)}px` }">
    <Bar v-if="lowItems.length > 0" :data="chartData" :options="options" />
    <div v-else class="h-full flex items-center justify-center text-slate-500 text-sm">
      All stock levels OK
    </div>
  </div>
</template>
