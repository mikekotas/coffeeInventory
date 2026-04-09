<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { useNotificationsStore } from '@/stores/notificationsStore'
import { useToast } from '@/composables/useToast'
import { Bell, LogOut, ChevronDown, Coffee, Menu, ArrowLeftRight } from 'lucide-vue-next'
import { ROUTE_NAMES } from '@/lib/constants'
import NotificationList from '@/components/notifications/NotificationList.vue'

interface Props {
  title?: string
}
defineProps<Props>()
const emit = defineEmits<{ toggleSidebar: [] }>()

const authStore = useAuthStore()
const notificationsStore = useNotificationsStore()
const router = useRouter()
const toast = useToast()
const showNotifications = ref(false)
const showUserMenu = ref(false)

// Admin can always switch to staff/receiver views (they have access to all routes)
const switchViews = computed(() => {
  const views = []
  views.push({ label: 'Staff View', route: ROUTE_NAMES.STAFF_POS })
  views.push({ label: 'Receiver View', route: ROUTE_NAMES.RECEIVER_QUEUE })
  return views
})

async function logout() {
  await authStore.logout()
  router.push({ name: ROUTE_NAMES.LOGIN })
  toast.info('Logged out')
}
</script>

<template>
  <header class="bg-slate-900/80 backdrop-blur border-b border-slate-800 px-4 lg:px-6 py-3 flex items-center justify-between sticky top-0 z-30">
    <div class="flex items-center gap-3">
      <!-- Hamburger (mobile only) -->
      <button
        class="lg:hidden p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        @click="emit('toggleSidebar')"
      >
        <Menu class="w-5 h-5" />
      </button>
      <!-- Mobile logo (desktop hides it since sidebar has the logo) -->
      <div class="lg:hidden w-7 h-7 bg-brand-600 rounded-lg flex items-center justify-center">
        <Coffee class="w-3.5 h-3.5 text-white" />
      </div>
      <h1 class="font-semibold text-white text-sm lg:text-base">{{ title ?? 'Dashboard' }}</h1>
    </div>

    <div class="flex items-center gap-2">
      <!-- Notification bell -->
      <div class="relative">
        <button
          class="relative p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          @click="showNotifications = !showNotifications"
        >
          <Bell class="w-5 h-5" />
          <span
            v-if="notificationsStore.unreadCount > 0"
            class="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"
          />
        </button>
        <NotificationList v-if="showNotifications" @close="showNotifications = false" />
      </div>

      <!-- User menu -->
      <div class="relative">
        <button
          class="flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-slate-800 transition-colors"
          @click="showUserMenu = !showUserMenu"
        >
          <div class="w-7 h-7 bg-brand-600/30 border border-brand-600/50 rounded-lg flex items-center justify-center">
            <span class="text-xs font-bold text-brand-400">
              {{ authStore.profile?.full_name?.charAt(0).toUpperCase() }}
            </span>
          </div>
          <span class="hidden sm:block text-sm text-slate-300 max-w-[120px] truncate">
            {{ authStore.profile?.full_name }}
          </span>
          <ChevronDown class="w-3.5 h-3.5 text-slate-500" />
        </button>

        <!-- Dropdown -->
        <Transition name="fade">
          <div
            v-if="showUserMenu"
            class="absolute right-0 top-full mt-1 w-44 bg-slate-800 border border-slate-700 rounded-xl shadow-xl py-1 z-50"
          >
            <div class="px-3 py-2 border-b border-slate-700 mb-1">
              <p class="text-xs font-semibold text-white truncate">{{ authStore.profile?.full_name }}</p>
              <p class="text-xs text-slate-500">Admin</p>
            </div>
            <button
              v-for="v in switchViews"
              :key="v.route"
              class="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-300 hover:bg-slate-700 transition-colors"
              @click="router.push({ name: v.route }); showUserMenu = false"
            >
              <ArrowLeftRight class="w-4 h-4" />
              {{ v.label }}
            </button>
            <div class="my-1 border-t border-slate-700" />
            <button
              class="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-400 hover:bg-slate-700 transition-colors"
              @click="logout"
            >
              <LogOut class="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </Transition>
      </div>
    </div>
  </header>
</template>

<style scoped>
.fade-enter-active, .fade-leave-active { transition: opacity 0.15s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
