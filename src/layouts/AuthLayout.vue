<script setup lang="ts">
import { Coffee } from 'lucide-vue-next'
</script>

<template>
  <div class="min-h-screen bg-slate-950 flex items-center justify-center p-4">
    <!-- Background ambient glow -->
    <div class="absolute inset-0 overflow-hidden pointer-events-none">
      <div class="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-brand-600/10 rounded-full blur-3xl" />
    </div>

    <div class="relative w-full max-w-sm">
      <!-- Logo -->
      <div class="flex flex-col items-center mb-8">
        <div class="w-14 h-14 bg-brand-600 rounded-2xl flex items-center justify-center shadow-lg shadow-brand-900/50 mb-3">
          <Coffee class="w-7 h-7 text-white" />
        </div>
        <h1 class="text-xl font-bold text-white">Coffee Inventory Pro</h1>
        <p class="text-sm text-slate-500 mt-0.5">Professional shop management</p>
      </div>

      <!-- Card -->
      <div class="bg-slate-800/80 backdrop-blur border border-slate-700/50 rounded-2xl p-6 shadow-2xl">
        <slot />
      </div>
    </div>
  </div>
</template>
