<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useReceiverShiftsStore } from '@/stores/receiverShiftsStore'
import { useSalesStore } from '@/stores/salesStore'
import { useAuthStore } from '@/stores/authStore'
import { useToast } from '@/composables/useToast'
import { useFormatters } from '@/composables/useFormatters'
import { useI18n } from 'vue-i18n'
import AppCard from '@/components/ui/AppCard.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppStatCard from '@/components/ui/AppStatCard.vue'
import AppEmptyState from '@/components/ui/AppEmptyState.vue'
import { Clock, Play, Square, TrendingUp, ShoppingBag } from 'lucide-vue-next'

const receiverShiftsStore = useReceiverShiftsStore()
const salesStore = useSalesStore()
const authStore = useAuthStore()
const toast = useToast()
const { formatCurrency, formatDate, formatTime } = useFormatters()
const { t } = useI18n()

const starting = ref(false)
const ending = ref(false)
const shiftSales = ref<typeof salesStore.mySales>([])

onMounted(async () => {
  await receiverShiftsStore.initialize()
  if (authStore.profile) {
    await salesStore.fetchMine(authStore.profile.id)
  }
  if (receiverShiftsStore.currentShift) {
    shiftSales.value = await salesStore.fetchByShift(receiverShiftsStore.currentShift.id)
  }
})

const shiftRevenue = computed(() =>
  shiftSales.value.reduce((sum, s) => sum + s.total_amount, 0)
)

async function handleStart() {
  starting.value = true
  try {
    await receiverShiftsStore.startShift()
    shiftSales.value = []
    toast.success(t('shift.shiftStartedShort'))
  } catch {
    toast.error(t('shift.startFailed'))
  } finally {
    starting.value = false
  }
}

async function handleEnd() {
  ending.value = true
  try {
    await receiverShiftsStore.endShift()
    toast.success(t('shift.shiftEnded'))
  } catch {
    toast.error(t('shift.endFailed'))
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
            receiverShiftsStore.hasActiveShift ? 'bg-emerald-500/20' : 'bg-slate-700',
          ]"
        >
          <Clock :class="['w-5 h-5', receiverShiftsStore.hasActiveShift ? 'text-emerald-400' : 'text-slate-400']" />
        </div>
        <div>
          <p class="text-sm font-semibold text-white">
            {{ receiverShiftsStore.hasActiveShift ? t('shift.shiftActive') : t('shift.noActiveShift') }}
          </p>
          <p class="text-xs text-slate-500">
            {{ receiverShiftsStore.hasActiveShift
              ? t('shift.startedAt', { time: formatTime(receiverShiftsStore.currentShift!.started_at), duration: receiverShiftsStore.shiftDuration })
              : t('shift.startToLogReceiver')
            }}
          </p>
        </div>
        <div v-if="receiverShiftsStore.hasActiveShift" class="ml-auto">
          <span class="flex items-center gap-1.5 text-xs text-emerald-400">
            <span class="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            {{ t('common.live') }}
          </span>
        </div>
      </div>

      <div v-if="!receiverShiftsStore.hasActiveShift">
        <AppButton full-width :loading="starting" @click="handleStart">
          <Play class="w-4 h-4" /> {{ t('shift.startShift') }}
        </AppButton>
      </div>
      <div v-else>
        <AppButton full-width variant="danger" :loading="ending" @click="handleEnd">
          <Square class="w-4 h-4" /> {{ t('shift.endShift') }}
        </AppButton>
      </div>
    </AppCard>

    <!-- Current shift stats -->
    <div v-if="receiverShiftsStore.hasActiveShift" class="grid grid-cols-2 gap-3">
      <AppStatCard
        :title="t('shift.shiftRevenue')"
        :value="formatCurrency(shiftRevenue)"
        icon-bg="bg-brand-500/20"
      >
        <template #icon><TrendingUp class="w-5 h-5 text-brand-400" /></template>
      </AppStatCard>
      <AppStatCard
        :title="t('shift.sales')"
        :value="shiftSales.length"
        :subtitle="t('shift.thisShift')"
        icon-bg="bg-blue-500/20"
      >
        <template #icon><ShoppingBag class="w-5 h-5 text-blue-400" /></template>
      </AppStatCard>
    </div>

    <!-- Sales in current shift -->
    <div v-if="receiverShiftsStore.hasActiveShift">
      <h3 class="text-sm font-semibold text-slate-300 mb-2">{{ t('shift.salesThisShift') }}</h3>
      <AppCard padding="none">
        <AppEmptyState
          v-if="shiftSales.length === 0"
          :title="t('shift.noSalesYet')"
          :description="t('shift.firstSale')"
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
