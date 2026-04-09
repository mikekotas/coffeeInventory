<script setup lang="ts">
interface Props {
  title: string
  description?: string
  icon?: string
}
defineProps<Props>()
</script>

<template>
  <div class="flex flex-col items-center justify-center py-16 px-4 text-center">
    <div class="w-16 h-16 rounded-2xl bg-slate-700/60 flex items-center justify-center mb-4">
      <slot name="icon">
        <svg class="w-8 h-8 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0H4" />
        </svg>
      </slot>
    </div>
    <h3 class="text-base font-semibold text-slate-300">{{ title }}</h3>
    <p v-if="description" class="text-sm text-slate-500 mt-1 max-w-xs">{{ description }}</p>
    <div v-if="$slots.action" class="mt-4">
      <slot name="action" />
    </div>
  </div>
</template>
