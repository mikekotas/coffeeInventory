<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useShiftsStore } from '@/stores/shiftsStore'
import { useSalesStore } from '@/stores/salesStore'
import { useAuthStore } from '@/stores/authStore'
import { useToast } from '@/composables/useToast'
import { useFormatters } from '@/composables/useFormatters'
import AppCard from '@/components/ui/AppCard.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppStatCard from '@/components/ui/AppStatCard.vue'
import AppEmptyState from '@/components/ui/AppEmptyState.vue'
import { Clock, Play, Square, TrendingUp, ShoppingBag } from 'lucide-vue-next'

const shiftsStore = useShiftsStore()
const salesStore = useSalesStore()
const authStore = useAuthStore()
const toast = useToast()
const { formatCurrency, formatDate, formatTime } = useFormatters()

const starting = ref(false)
const ending = ref(false)
const shiftSales = ref<typeof salesStore.mySales>([])

onMounted(async () => {
  await shiftsStore.initialize()
  if (authStore.profile) {
    await salesStore.fetchMine(authStore.profile.id)
  }
  if (shiftsStore.currentShift) {
    shiftSales.value = await salesStore.fetchByShift(shiftsStore.currentShift.id)
  }
})

const shiftRevenue = computed(() =>
  shiftSales.value.reduce((sum, s) => sum + s.total_amount, 0)
)

async function handleStart() {
  starting.value = true
  try {
    await shiftsStore.startShift()
    shiftSales.value = []
    toast.success('Shift started! Good luck 💪')
  } catch {
    toast.error('Failed to start shift')
  } finally {
    starting.value = false
  }
}

async function handleEnd() {
  ending.value = true
  try {
    await shiftsStore.endShift()
    toast.success('Shift ended. Great work!')
  } catch {
    toast.error('Failed to end shift')
  } finally {
    ending.value = false
  }
}
</script>

<template>
  <div class="p-4 space-y-4">
    <!-- Shift Status Card -->
    <AppCard padding="md">
      <div class="flex items-center gap-3 mb-4">
        <div
          :class="[
            'w-10 h-10 rounded-xl flex items-center justify-center',
            shiftsStore.hasActiveShift ? 'bg-emerald-500/20' : 'bg-slate-700',
          ]"
        >
          <Clock :class="['w-5 h-5', shiftsStore.hasActiveShift ? 'text-emerald-400' : 'text-slate-400']" />
        </div>
        <div>
          <p class="text-sm font-semibold text-white">
            {{ shiftsStore.hasActiveShift ? 'Shift Active' : 'No Active Shift' }}
          </p>
          <p class="text-xs text-slate-500">
            {{ shiftsStore.hasActiveShift
              ? `Started ${formatTime(shiftsStore.currentShift!.started_at)} · ${shiftsStore.shiftDuration}`
              : 'Start a shift to begin logging sales'
            }}
          </p>
        </div>
        <div v-if="shiftsStore.hasActiveShift" class="ml-auto">
          <span class="flex items-center gap-1.5 text-xs text-emerald-400">
            <span class="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            Live
          </span>
        </div>
      </div>

      <div v-if="!shiftsStore.hasActiveShift">
        <AppButton full-width :loading="starting" @click="handleStart">
          <Play class="w-4 h-4" /> Start Shift
        </AppButton>
      </div>
      <div v-else>
        <AppButton full-width variant="danger" :loading="ending" @click="handleEnd">
          <Square class="w-4 h-4" /> End Shift
        </AppButton>
      </div>
    </AppCard>

    <!-- Current shift stats -->
    <div v-if="shiftsStore.hasActiveShift" class="grid grid-cols-2 gap-3">
      <AppStatCard
        title="Shift Revenue"
        :value="formatCurrency(shiftRevenue)"
        icon-bg="bg-brand-500/20"
      >
        <template #icon><TrendingUp class="w-5 h-5 text-brand-400" /></template>
      </AppStatCard>
      <AppStatCard
        title="Sales"
        :value="shiftSales.length"
        subtitle="This shift"
        icon-bg="bg-blue-500/20"
      >
        <template #icon><ShoppingBag class="w-5 h-5 text-blue-400" /></template>
      </AppStatCard>
    </div>

    <!-- Sales in current shift -->
    <div v-if="shiftsStore.hasActiveShift">
      <h3 class="text-sm font-semibold text-slate-300 mb-2">Sales This Shift</h3>
      <AppCard padding="none">
        <AppEmptyState
          v-if="shiftSales.length === 0"
          title="No sales yet"
          description="Make your first sale from the POS screen"
        />
        <div v-else class="divide-y divide-slate-700/50">
          <div
            v-for="sale in shiftSales"
            :key="sale.id"
            class="flex items-center gap-3 px-4 py-3"
          >
            <div class="flex-1 min-w-0">
              <p class="text-xs text-slate-400">{{ formatDate(sale.created_at) }}</p>
              <p class="text-xs text-slate-500 mt-0.5">
                {{ sale.sale_items?.map(si => si.product?.name).join(', ') }}
              </p>
            </div>
            <p class="text-sm font-semibold text-white">{{ formatCurrency(sale.total_amount) }}</p>
          </div>
        </div>
      </AppCard>
    </div>
  </div>
</template>
