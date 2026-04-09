<script setup lang="ts">
interface Tab {
  key: string
  label: string
  count?: number
}

interface Props {
  tabs: Tab[]
  modelValue: string
}

defineProps<Props>()
const emit = defineEmits<{ 'update:modelValue': [key: string] }>()
</script>

<template>
  <div class="flex gap-1 bg-slate-900/50 rounded-xl p-1 border border-slate-700/50">
    <button
      v-for="tab in tabs"
      :key="tab.key"
      :class="[
        'flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all',
        modelValue === tab.key
          ? 'bg-slate-700 text-white shadow-sm'
          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/40',
      ]"
      @click="emit('update:modelValue', tab.key)"
    >
      {{ tab.label }}
      <span
        v-if="tab.count !== undefined"
        :class="[
          'text-xs px-1.5 py-0.5 rounded-full',
          modelValue === tab.key ? 'bg-slate-600 text-slate-300' : 'bg-slate-700/60 text-slate-500',
        ]"
      >
        {{ tab.count }}
      </span>
    </button>
  </div>
</template>
