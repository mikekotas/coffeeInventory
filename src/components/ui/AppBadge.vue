<script setup lang="ts">
type BadgeVariant = 'gray' | 'amber' | 'green' | 'red' | 'blue' | 'purple' | 'yellow'

interface Props {
  variant?: BadgeVariant
  dot?: boolean
  size?: 'sm' | 'md'
}
withDefaults(defineProps<Props>(), { variant: 'gray', dot: false, size: 'md' })

const variantClasses: Record<BadgeVariant, string> = {
  gray: 'bg-slate-700 text-slate-300',
  amber: 'bg-amber-500/20 text-amber-400 ring-1 ring-amber-500/30',
  green: 'bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/30',
  red: 'bg-red-500/20 text-red-400 ring-1 ring-red-500/30',
  blue: 'bg-blue-500/20 text-blue-400 ring-1 ring-blue-500/30',
  purple: 'bg-purple-500/20 text-purple-400 ring-1 ring-purple-500/30',
  yellow: 'bg-yellow-500/20 text-yellow-400 ring-1 ring-yellow-500/30',
}

const dotClasses: Record<BadgeVariant, string> = {
  gray: 'bg-slate-400',
  amber: 'bg-amber-400',
  green: 'bg-emerald-400',
  red: 'bg-red-400',
  blue: 'bg-blue-400',
  purple: 'bg-purple-400',
  yellow: 'bg-yellow-400',
}
</script>

<template>
  <span
    :class="[
      'inline-flex items-center gap-1.5 font-medium rounded-full',
      variantClasses[variant ?? 'gray'],
      size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs',
    ]"
  >
    <span v-if="dot" :class="['w-1.5 h-1.5 rounded-full shrink-0', dotClasses[variant ?? 'gray']]" />
    <slot />
  </span>
</template>
