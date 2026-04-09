<script setup lang="ts">
interface Props {
  title: string
  value: string | number
  subtitle?: string
  trend?: { value: number; label: string }
  iconBg?: string
}
defineProps<Props>()
</script>

<template>
  <div class="bg-slate-800 rounded-2xl border border-slate-700/50 p-5">
    <div class="flex items-start justify-between">
      <div class="flex-1 min-w-0">
        <p class="text-sm text-slate-400 font-medium truncate">{{ title }}</p>
        <p class="text-2xl font-bold text-white mt-1 truncate">{{ value }}</p>
        <p v-if="subtitle" class="text-xs text-slate-500 mt-0.5">{{ subtitle }}</p>
      </div>
      <div
        v-if="$slots.icon"
        :class="['w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ml-3', iconBg ?? 'bg-brand-500/20']"
      >
        <slot name="icon" />
      </div>
    </div>
    <div v-if="trend" class="mt-3 flex items-center gap-1.5">
      <span
        :class="[
          'text-xs font-medium',
          trend.value >= 0 ? 'text-emerald-400' : 'text-red-400',
        ]"
      >
        {{ trend.value >= 0 ? '↑' : '↓' }} {{ Math.abs(trend.value) }}%
      </span>
      <span class="text-xs text-slate-500">{{ trend.label }}</span>
    </div>
  </div>
</template>
