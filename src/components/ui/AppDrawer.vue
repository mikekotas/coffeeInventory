<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'

interface Props {
  open: boolean
  title?: string
  side?: 'right' | 'bottom'
}

const props = withDefaults(defineProps<Props>(), { side: 'right' })
const emit = defineEmits<{ close: [] }>()

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && props.open) emit('close')
}
onMounted(() => document.addEventListener('keydown', onKeydown))
onUnmounted(() => document.removeEventListener('keydown', onKeydown))
</script>

<template>
  <Teleport to="body">
    <Transition name="drawer">
      <div v-if="open" class="fixed inset-0 z-50 flex" :class="side === 'right' ? 'justify-end' : 'items-end'">
        <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="emit('close')" />
        <div
          :class="[
            'relative bg-slate-800 border-slate-700 shadow-2xl flex flex-col',
            side === 'right'
              ? 'h-full w-full max-w-sm border-l animate-slide-in-right'
              : 'w-full max-h-[90vh] rounded-t-2xl border-t animate-slide-in-up',
          ]"
        >
          <div class="flex items-center justify-between px-4 py-3 border-b border-slate-700 shrink-0">
            <h3 class="font-semibold text-white">{{ title }}</h3>
            <button
              class="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
              @click="emit('close')"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div class="flex-1 overflow-y-auto">
            <slot />
          </div>
          <div v-if="$slots.footer" class="shrink-0 border-t border-slate-700">
            <slot name="footer" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
