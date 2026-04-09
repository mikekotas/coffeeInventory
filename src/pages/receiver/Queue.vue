<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useReceiverStore } from '@/stores/receiverStore'
import { useReceiverShiftsStore } from '@/stores/receiverShiftsStore'
import { useReceiverRealtime } from '@/composables/useRealtime'
import { useToast } from '@/composables/useToast'
import OrderCard from '@/components/receiver/OrderCard.vue'
import AppEmptyState from '@/components/ui/AppEmptyState.vue'
import AppSpinner from '@/components/ui/AppSpinner.vue'
import { CheckCheck, Clock, Users } from 'lucide-vue-next'
import type { Shift } from '@/types' // used for activeShifts ref typing

const receiverStore = useReceiverStore()
const receiverShiftsStore = useReceiverShiftsStore()
const toast = useToast()

useReceiverRealtime()

const activeShifts = ref<Shift[]>([])
let shiftPollInterval: ReturnType<typeof setInterval>

onMounted(async () => {
  await receiverStore.fetchQueue()
  await loadActiveShifts()
  // Poll active shifts every 60s to keep the strip up to date
  shiftPollInterval = setInterval(loadActiveShifts, 60_000)
})

onUnmounted(() => clearInterval(shiftPollInterval))

async function loadActiveShifts() {
  try {
    activeShifts.value = await receiverShiftsStore.fetchAllActive()
  } catch {
    // Non-critical — don't block the queue
  }
}

async function handleComplete(saleId: string) {
  try {
    await receiverStore.markComplete(saleId)
    toast.success('Order marked as done')
  } catch {
    toast.error('Failed to mark order complete')
  }
}
</script>

<template>
  <div class="p-4 space-y-5 max-w-4xl mx-auto">

    <!-- Active shifts strip -->
    <div v-if="activeShifts.length > 0" class="flex items-center gap-2 flex-wrap">
      <div class="flex items-center gap-1.5 text-xs text-slate-500 mr-1">
        <Users class="w-3.5 h-3.5" />
        <span>On shift:</span>
      </div>
      <span
        v-for="shift in activeShifts"
        :key="shift.id"
        class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-medium"
      >
        <span class="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
        {{ shift.profile?.full_name ?? 'Staff' }}
      </span>
    </div>

    <!-- Pending queue -->
    <section>
      <div class="flex items-center justify-between mb-3">
        <h2 class="text-sm font-semibold text-white flex items-center gap-2">
          <Clock class="w-4 h-4 text-amber-400" />
          Pending
          <span
            v-if="receiverStore.pendingCount > 0"
            class="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none"
          >
            {{ receiverStore.pendingCount }}
          </span>
        </h2>
      </div>

      <AppSpinner v-if="receiverStore.loading" center />

      <div v-else-if="receiverStore.pendingQueue.length === 0">
        <AppEmptyState
          title="All caught up!"
          description="No pending orders. New orders will appear here instantly."
        >
          <template #icon>
            <CheckCheck class="w-8 h-8 text-emerald-500" />
          </template>
        </AppEmptyState>
      </div>

      <TransitionGroup
        v-else
        name="order-list"
        tag="div"
        class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
      >
        <OrderCard
          v-for="sale in receiverStore.pendingQueue"
          :key="sale.id"
          :sale="sale"
          :completing="receiverStore.completing === sale.id"
          @complete="handleComplete"
        />
      </TransitionGroup>
    </section>

    <!-- Recently completed -->
    <section v-if="receiverStore.recentCompleted.length > 0">
      <h2 class="text-sm font-semibold text-slate-500 flex items-center gap-2 mb-3">
        <CheckCheck class="w-4 h-4" />
        Recently Completed
      </h2>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <OrderCard
          v-for="sale in receiverStore.recentCompleted"
          :key="sale.id"
          :sale="sale"
          :completing="false"
          @complete="handleComplete"
        />
      </div>
    </section>

  </div>
</template>

<style scoped>
.order-list-enter-active {
  animation: order-in 0.35s ease-out;
}
.order-list-leave-active {
  animation: order-in 0.25s ease-in reverse;
}
.order-list-move {
  transition: transform 0.3s ease;
}

@keyframes order-in {
  from {
    opacity: 0;
    transform: translateY(-12px) scale(0.97);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
</style>
