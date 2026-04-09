<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useReceiverShiftsStore } from '@/stores/receiverShiftsStore'
import { useReceiverStore } from '@/stores/receiverStore'
import { useAuthStore } from '@/stores/authStore'
import { ROUTE_NAMES } from '@/lib/constants'
import { Monitor, ShoppingCart, Clock, LogOut } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const receiverShiftsStore = useReceiverShiftsStore()
const receiverStore = useReceiverStore()
const authStore = useAuthStore()

const pageTitles: Record<string, string> = {
  [ROUTE_NAMES.RECEIVER_QUEUE]: 'Order Queue',
  [ROUTE_NAMES.RECEIVER_POS]: 'Quick Sale',
  [ROUTE_NAMES.RECEIVER_MY_SHIFT]: 'My Shift',
}

const title = computed(() => pageTitles[route.name as string] ?? 'Receiver')

// Clock
const now = ref(new Date())
let clockInterval: ReturnType<typeof setInterval>

onMounted(async () => {
  clockInterval = setInterval(() => { now.value = new Date() }, 1000)
  await receiverShiftsStore.initialize()
})

onUnmounted(() => clearInterval(clockInterval))

const currentTime = computed(() =>
  now.value.toLocaleTimeString('el-GR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
)

const navItems = [
  { name: ROUTE_NAMES.RECEIVER_QUEUE, label: 'Queue', icon: Monitor },
  { name: ROUTE_NAMES.RECEIVER_POS, label: 'Sale', icon: ShoppingCart },
  { name: ROUTE_NAMES.RECEIVER_MY_SHIFT, label: 'Shift', icon: Clock },
]

async function logout() {
  await authStore.logout()
  router.push({ name: ROUTE_NAMES.LOGIN })
}
</script>

<template>
  <div class="min-h-screen bg-slate-950 flex flex-col">
    <!-- Header -->
    <header class="sticky top-0 z-30 bg-slate-900 border-b border-slate-800 px-4 py-3 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="w-8 h-8 bg-amber-500/20 rounded-lg flex items-center justify-center">
          <Monitor class="w-4 h-4 text-amber-400" />
        </div>
        <div>
          <p class="text-xs text-slate-500 leading-none">Receiver</p>
          <p class="text-sm font-semibold text-white leading-tight">{{ title }}</p>
        </div>
      </div>

      <div class="flex items-center gap-3">
        <!-- Shift status chip -->
        <div
          :class="[
            'hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
            receiverShiftsStore.hasActiveShift
              ? 'bg-emerald-500/15 text-emerald-400'
              : 'bg-slate-700/60 text-slate-500',
          ]"
        >
          <span
            :class="[
              'w-1.5 h-1.5 rounded-full',
              receiverShiftsStore.hasActiveShift ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500',
            ]"
          />
          {{ receiverShiftsStore.hasActiveShift ? receiverShiftsStore.shiftDuration : 'No shift' }}
        </div>

        <!-- Clock -->
        <span class="hidden sm:block text-xs font-mono text-slate-400 tabular-nums">{{ currentTime }}</span>

        <!-- Logout -->
        <button
          class="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition-colors"
          title="Logout"
          @click="logout"
        >
          <LogOut class="w-4 h-4" />
        </button>
      </div>
    </header>

    <!-- Content -->
    <main class="flex-1 overflow-auto pb-16">
      <RouterView />
    </main>

    <!-- Bottom nav -->
    <nav class="fixed bottom-0 inset-x-0 z-30 bg-slate-900 border-t border-slate-800 flex">
      <RouterLink
        v-for="item in navItems"
        :key="item.name"
        :to="{ name: item.name }"
        class="flex-1 flex flex-col items-center justify-center gap-1 py-2 transition-colors"
        :class="route.name === item.name ? 'text-amber-400' : 'text-slate-500 hover:text-slate-300'"
      >
        <div class="relative">
          <component :is="item.icon" class="w-5 h-5" />
          <!-- Pending badge on Queue tab -->
          <span
            v-if="item.name === ROUTE_NAMES.RECEIVER_QUEUE && receiverStore.pendingCount > 0"
            class="absolute -top-1.5 -right-2 min-w-[16px] h-4 bg-red-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white px-1"
          >
            {{ receiverStore.pendingCount > 99 ? '99+' : receiverStore.pendingCount }}
          </span>
        </div>
        <span class="text-[10px] font-medium">{{ item.label }}</span>
      </RouterLink>
    </nav>
  </div>
</template>
