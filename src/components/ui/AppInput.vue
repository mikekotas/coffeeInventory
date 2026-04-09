<script setup lang="ts">
interface Props {
  modelValue?: string | number
  label?: string
  placeholder?: string
  type?: string
  error?: string
  hint?: string
  required?: boolean
  disabled?: boolean
  readonly?: boolean
  prefix?: string
  suffix?: string
}

withDefaults(defineProps<Props>(), {
  type: 'text',
  modelValue: '',
})

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
    <div class="relative">
      <span v-if="prefix" class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none">
        {{ prefix }}
      </span>
      <input
        :type="type"
        :value="modelValue"
        :placeholder="placeholder"
        :required="required"
        :disabled="disabled"
        :readonly="readonly"
        :class="[
          'w-full bg-slate-700/60 border rounded-xl text-slate-100 placeholder-slate-500',
          'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent',
          'transition-colors text-sm py-2.5',
          prefix ? 'pl-8' : 'pl-3',
          suffix ? 'pr-8' : 'pr-3',
          error ? 'border-red-500 focus:ring-red-500' : 'border-slate-600',
          disabled ? 'opacity-50 cursor-not-allowed' : '',
        ]"
        @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
      />
      <span v-if="suffix" class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none">
        {{ suffix }}
      </span>
    </div>
    <p v-if="error" class="text-xs text-red-400">{{ error }}</p>
    <p v-else-if="hint" class="text-xs text-slate-500">{{ hint }}</p>
  </div>
</template>
