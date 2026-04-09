<script setup lang="ts">
interface Props {
  padding?: 'none' | 'sm' | 'md' | 'lg'
  hoverable?: boolean
}
withDefaults(defineProps<Props>(), { padding: 'md', hoverable: false })
</script>

<template>
  <div
    :class="[
      'bg-slate-800 rounded-2xl border border-slate-700/50',
      hoverable && 'hover:border-slate-600 hover:bg-slate-750 transition-colors cursor-pointer',
      padding === 'none' && 'overflow-hidden',
      padding === 'sm' && 'p-3',
      padding === 'md' && 'p-4',
      padding === 'lg' && 'p-6',
    ]"
  >
    <slot />
  </div>
</template>
