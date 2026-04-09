<script setup lang="ts">
import { useShiftsStore } from '@/stores/shiftsStore'
import { useRouter } from 'vue-router'
import { ROUTE_NAMES } from '@/lib/constants'
import { Clock, AlertCircle } from 'lucide-vue-next'
import AppButton from '@/components/ui/AppButton.vue'

const shiftsStore = useShiftsStore()
const router = useRouter()
</script>

<template>
  <!-- No active shift warning -->
  <div
    v-if="!shiftsStore.hasActiveShift"
    class="mx-4 mt-4 flex items-center gap-3 bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-3"
  >
    <AlertCircle class="w-4 h-4 text-amber-400 shrink-0" />
    <p class="text-sm text-amber-300 flex-1">No active shift. Start a shift to log your sales.</p>
    <AppButton size="xs" variant="outline" @click="router.push({ name: ROUTE_NAMES.STAFF_MY_SHIFT })">
      Start Shift
    </AppButton>
  </div>

  <!-- Active shift info -->
  <div
    v-else
    class="mx-4 mt-4 flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-2.5"
  >
    <Clock class="w-4 h-4 text-emerald-400 shrink-0" />
    <p class="text-sm text-emerald-300 flex-1">
      Shift active — {{ shiftsStore.shiftDuration }}
    </p>
    <span class="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
  </div>
</template>
