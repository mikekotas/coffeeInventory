<script setup lang="ts">
import { useToast } from '@/composables/useToast'
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-vue-next'

const { toasts, dismiss } = useToast()

const icons = { success: CheckCircle, error: XCircle, warning: AlertTriangle, info: Info }
const colors = {
  success: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
  error: 'border-red-500/30 bg-red-500/10 text-red-400',
  warning: 'border-amber-500/30 bg-amber-500/10 text-amber-400',
  info: 'border-blue-500/30 bg-blue-500/10 text-blue-400',
}
const titleColors = {
  success: 'text-emerald-300',
  error: 'text-red-300',
  warning: 'text-amber-300',
  info: 'text-blue-300',
}
</script>

<template>
  <Teleport to="body">
    <div class="fixed top-4 right-4 z-[100] flex flex-col gap-2 w-80 pointer-events-none">
      <TransitionGroup name="toast">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          :class="[
            'flex items-start gap-3 p-3.5 rounded-xl border shadow-lg pointer-events-auto',
            'bg-slate-800/95 backdrop-blur',
            colors[toast.type],
          ]"
        >
          <component :is="icons[toast.type]" class="w-5 h-5 shrink-0 mt-0.5" />
          <div class="flex-1 min-w-0">
            <p :class="['text-sm font-semibold', titleColors[toast.type]]">{{ toast.title }}</p>
            <p v-if="toast.message" class="text-xs text-slate-400 mt-0.5">{{ toast.message }}</p>
          </div>
          <button
            class="text-slate-500 hover:text-slate-300 transition-colors shrink-0"
            @click="dismiss(toast.id)"
          >
            <X class="w-4 h-4" />
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style scoped>
.toast-enter-active { transition: all 0.3s ease-out; }
.toast-leave-active { transition: all 0.2s ease-in; }
.toast-enter-from { opacity: 0; transform: translateX(100%); }
.toast-leave-to { opacity: 0; transform: translateX(100%); }
.toast-move { transition: transform 0.3s; }
</style>
