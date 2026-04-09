<script setup lang="ts">
import { computed } from 'vue'
import { Line } from 'vue-chartjs'
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, Title, Tooltip, Legend, Filler,
} from 'chart.js'
import type { DailyRevenue } from '@/types'
import { CHART_COLORS } from '@/lib/constants'
import { format } from 'date-fns'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler)

interface Props {
  data: DailyRevenue[]
}
const props = defineProps<Props>()

const chartData = computed(() => ({
  labels: props.data.map(d => format(new Date(d.sale_date), 'dd MMM')),
  datasets: [
    {
      label: 'Revenue (€)',
      data: props.data.map(d => Number(d.total_revenue)),
      borderColor: CHART_COLORS.primary,
      backgroundColor: CHART_COLORS.primaryAlpha,
      borderWidth: 2,
      fill: true,
      tension: 0.4,
      pointBackgroundColor: CHART_COLORS.primary,
      pointRadius: 4,
      pointHoverRadius: 6,
    },
  ],
}))

const options = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: '#1e293b',
      borderColor: '#334155',
      borderWidth: 1,
      titleColor: '#f1f5f9',
      bodyColor: '#94a3b8',
      callbacks: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        label: (ctx: any) => `€ ${(ctx.parsed.y ?? 0).toFixed(2)}`,
      },
    },
  },
  scales: {
    x: {
      grid: { color: '#1e293b' },
      ticks: { color: '#64748b', font: { size: 11 } },
    },
    y: {
      grid: { color: '#1e293b' },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ticks: { color: '#64748b', font: { size: 11 }, callback: (v: any) => `€${v}` },
    },
  },
}
</script>

<template>
  <div class="h-64">
    <Line v-if="data.length > 0" :data="chartData" :options="options" />
    <div v-else class="h-full flex items-center justify-center text-slate-500 text-sm">
      No revenue data yet
    </div>
  </div>
</template>
