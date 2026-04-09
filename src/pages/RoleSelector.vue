<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { ROUTE_NAMES } from '@/lib/constants'
import { Coffee, Monitor, LogOut } from 'lucide-vue-next'

const authStore = useAuthStore()
const router = useRouter()

// Only show non-admin roles for selection (admin always has own dashboard)
const selectableRoles = computed(() =>
  (authStore.profile?.roles ?? []).filter(r => r !== 'admin')
)

const roleConfig = {
  staff: {
    label: 'Staff',
    description: 'POS, sales, shift tracking',
    icon: Coffee,
    color: 'brand',
    route: ROUTE_NAMES.STAFF_POS,
  },
  receiver: {
    label: 'Receiver',
    description: 'Order queue, fulfillment',
    icon: Monitor,
    color: 'amber',
    route: ROUTE_NAMES.RECEIVER_QUEUE,
  },
}

function selectRole(routeName: string) {
  router.push({ name: routeName })
}

async function logout() {
  await authStore.logout()
  router.push({ name: ROUTE_NAMES.LOGIN })
}
</script>

<template>
  <div class="min-h-screen bg-slate-950 flex flex-col items-center justify-center px-4">
    <div class="w-full max-w-sm space-y-6">
      <!-- Header -->
      <div class="text-center">
        <div class="w-12 h-12 bg-brand-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Coffee class="w-6 h-6 text-white" />
        </div>
        <h1 class="text-xl font-bold text-white">Select View</h1>
        <p class="text-sm text-slate-400 mt-1">
          Welcome back, {{ authStore.profile?.full_name?.split(' ')[0] }}. Choose where to go.
        </p>
      </div>

      <!-- Role cards -->
      <div class="space-y-3">
        <button
          v-for="r in selectableRoles"
          :key="r"
          class="w-full flex items-center gap-4 px-4 py-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-600 hover:bg-slate-800 transition-all text-left group"
          @click="selectRole(roleConfig[r].route)"
        >
          <div
            :class="[
              'w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-colors',
              r === 'staff' ? 'bg-brand-500/20 group-hover:bg-brand-500/30' : 'bg-amber-500/20 group-hover:bg-amber-500/30',
            ]"
          >
            <component
              :is="roleConfig[r].icon"
              :class="['w-5 h-5', r === 'staff' ? 'text-brand-400' : 'text-amber-400']"
            />
          </div>
          <div class="flex-1">
            <p class="text-sm font-semibold text-white">{{ roleConfig[r].label }}</p>
            <p class="text-xs text-slate-500">{{ roleConfig[r].description }}</p>
          </div>
          <svg class="w-4 h-4 text-slate-600 group-hover:text-slate-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      <!-- Logout -->
      <button
        class="flex items-center justify-center gap-2 w-full py-2 text-sm text-slate-500 hover:text-red-400 transition-colors"
        @click="logout"
      >
        <LogOut class="w-4 h-4" />
        Sign out
      </button>
    </div>
  </div>
</template>
