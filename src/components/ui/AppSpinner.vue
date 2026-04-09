<script setup lang="ts">
interface Props {
  size?: 'sm' | 'md' | 'lg'
  center?: boolean
}
withDefaults(defineProps<Props>(), { size: 'md', center: false })
</script>

<template>
  <div :class="center ? 'flex items-center justify-center py-12' : 'inline-flex'">
    <svg
      :class="[
        'animate-spin text-brand-500',
        size === 'sm' && 'w-4 h-4',
        size === 'md' && 'w-8 h-8',
        size === 'lg' && 'w-12 h-12',
      ]"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  </div>
</template>
