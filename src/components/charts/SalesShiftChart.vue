<script setup lang="ts">
import { computed } from 'vue'
import { Bar } from 'vue-chartjs'
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  Title, Tooltip, Legend,
} from 'chart.js'
import type { ShiftSales } from '@/types'
import { CHART_COLORS } from '@/lib/constants'
import { format } from 'date-fns'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

interface Props {
  data: ShiftSales[]
}
const props = defineProps<Props>()

const chartData = computed(() => ({
  labels: props.data.slice(0, 10).map(d =>
    `${d.staff_name.split(' ')[0]} ${format(new Date(d.started_at), 'dd/MM HH:mm')}`
  ),
  datasets: [
    {
      label: 'Revenue (€)',
      data: props.data.slice(0, 10).map(d => Number(d.total_revenue)),
      backgroundColor: CHART_COLORS.primaryAlpha,
      borderColor: CHART_COLORS.primary,
      borderWidth: 1,
      borderRadius: 8,
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
      grid: { display: false },
      ticks: { color: '#64748b', font: { size: 10 }, maxRotation: 30 },
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
    <Bar v-if="data.length > 0" :data="chartData" :options="options" />
    <div v-else class="h-full flex items-center justify-center text-slate-500 text-sm">
      No shift data yet
    </div>
  </div>
</template>
