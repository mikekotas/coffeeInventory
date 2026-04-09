<script setup lang="ts">
interface Option {
  value: string | number
  label: string
}

interface Props {
  modelValue?: string | number
  options: Option[]
  label?: string
  placeholder?: string
  error?: string
  required?: boolean
  disabled?: boolean
}

withDefaults(defineProps<Props>(), { modelValue: '' })

const emit = defineEmits<{
  'update:modelValue': [value: string | number]
}>()
</script>

<template>
  <div class="flex flex-col gap-1">
    <label v-if="label" class="text-sm font-medium text-slate-300">
      {{ label }}
      <span v-if="required" class="text-red-400 ml-0.5">*</span>
    </label>
    <select
      :value="modelValue"
      :required="required"
      :disabled="disabled"
      :class="[
        'w-full bg-slate-700/60 border rounded-xl text-slate-100 text-sm py-2.5 pl-3 pr-8',
        'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-colors',
        'appearance-none cursor-pointer',
        error ? 'border-red-500' : 'border-slate-600',
        disabled ? 'opacity-50 cursor-not-allowed' : '',
      ]"
      @change="emit('update:modelValue', ($event.target as HTMLSelectElement).value)"
    >
      <option v-if="placeholder" value="" disabled>{{ placeholder }}</option>
      <option
        v-for="opt in options"
        :key="opt.value"
        :value="opt.value"
        class="bg-slate-800"
      >
        {{ opt.label }}
      </option>
    </select>
    <p v-if="error" class="text-xs text-red-400">{{ error }}</p>
  </div>
</template>
