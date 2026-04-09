<script setup lang="ts">
import { onMounted } from 'vue'
import { RouterView } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import AppToast from '@/components/ui/AppToast.vue'
import AppConfirm from '@/components/ui/AppConfirm.vue'
import AppSpinner from '@/components/ui/AppSpinner.vue'

const authStore = useAuthStore()

onMounted(() => {
  authStore.initialize()
})
</script>

<template>
  <div class="min-h-screen bg-slate-950">
    <!-- Full-screen loading while auth initializes -->
    <div v-if="authStore.loading" class="fixed inset-0 bg-slate-950 flex items-center justify-center z-50">
      <div class="flex flex-col items-center gap-3">
        <div class="w-12 h-12 bg-brand-600 rounded-2xl flex items-center justify-center">
          <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707" />
          </svg>
        </div>
        <AppSpinner size="sm" />
        <p class="text-xs text-slate-500">Loading...</p>
      </div>
    </div>

    <RouterView v-else />

    <!-- Global overlays -->
    <AppToast />
    <AppConfirm />
  </div>
</template>
