<script setup lang="ts">
import { computed } from 'vue'
import { Doughnut } from 'vue-chartjs'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'
import type { TopProduct } from '@/types'
import { CHART_COLORS } from '@/lib/constants'

ChartJS.register(ArcElement, Tooltip, Legend)

interface Props {
  data: TopProduct[]
}
const props = defineProps<Props>()

const chartData = computed(() => ({
  labels: props.data.map(d => d.product_name),
  datasets: [
    {
      data: props.data.map(d => Number(d.total_revenue)),
      backgroundColor: CHART_COLORS.multiCategory,
      borderColor: '#0f172a',
      borderWidth: 2,
    },
  ],
}))

const options = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'right' as const,
      labels: { color: '#94a3b8', font: { size: 11 }, padding: 12, boxWidth: 12 },
    },
    tooltip: {
      backgroundColor: '#1e293b',
      borderColor: '#334155',
      borderWidth: 1,
      titleColor: '#f1f5f9',
      bodyColor: '#94a3b8',
      callbacks: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        label: (ctx: any) => `${ctx.label}: €${(ctx.parsed ?? 0).toFixed(2)}`,
      },
    },
  },
}
</script>

<template>
  <div class="h-56">
    <Doughnut v-if="data.length > 0" :data="chartData" :options="options" />
    <div v-else class="h-full flex items-center justify-center text-slate-500 text-sm">
      No product data yet
    </div>
  </div>
</template>
