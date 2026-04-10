<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { useShiftsStore } from '@/stores/shiftsStore'
import { useToast } from '@/composables/useToast'
import { Coffee, LogOut, ChevronDown, ArrowLeftRight } from 'lucide-vue-next'
import { ROUTE_NAMES } from '@/lib/constants'
import { useI18n } from 'vue-i18n'
import { setLocale } from '@/i18n'

interface Props {
  title?: string
}
defineProps<Props>()

const authStore = useAuthStore()
const shiftsStore = useShiftsStore()
const router = useRouter()
const toast = useToast()
const { t, locale } = useI18n()
const showMenu = ref(false)

const hasMultipleViews = computed(() => authStore.isReceiver)

function switchView() {
  router.push({ name: ROUTE_NAMES.SELECT_ROLE })
}

function toggleLocale() {
  setLocale(locale.value === 'en' ? 'el' : 'en')
}

async function logout() {
  await authStore.logout()
  router.push({ name: ROUTE_NAMES.LOGIN })
  toast.info(t('notifications.loggedOut'))
}
</script>

<template>
  <header class="bg-slate-900/80 backdrop-blur border-b border-slate-800 px-4 py-3 flex items-center justify-between sticky top-0 z-30">
    <div class="flex items-center gap-2.5">
      <div class="w-7 h-7 bg-brand-600 rounded-lg flex items-center justify-center">
        <Coffee class="w-3.5 h-3.5 text-white" />
      </div>
      <h1 class="font-semibold text-white text-sm">{{ title ?? 'Coffee Inv' }}</h1>
    </div>

    <div class="flex items-center gap-2">
      <!-- Language switcher -->
      <button
        class="px-2 py-1 rounded-lg text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors tabular-nums"
        @click="toggleLocale"
      >
        {{ locale === 'en' ? $t('lang.el') : $t('lang.en') }}
      </button>

      <!-- Shift status pill -->
      <div
        :class="[
          'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
          shiftsStore.hasActiveShift
            ? 'bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/30'
            : 'bg-slate-700 text-slate-400',
        ]"
      >
        <span
          :class="[
            'w-1.5 h-1.5 rounded-full',
            shiftsStore.hasActiveShift ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500',
          ]"
        />
        {{ shiftsStore.hasActiveShift ? shiftsStore.shiftDuration ?? $t('common.live') : $t('staffHeader.noShift') }}
      </div>

      <!-- User menu -->
      <div class="relative">
        <button
          class="flex items-center gap-1.5 px-2 py-1.5 rounded-xl hover:bg-slate-800 transition-colors"
          @click="showMenu = !showMenu"
        >
          <div class="w-6 h-6 bg-brand-600/30 border border-brand-600/50 rounded-lg flex items-center justify-center">
            <span class="text-xs font-bold text-brand-400">
              {{ authStore.profile?.full_name?.charAt(0).toUpperCase() }}
            </span>
          </div>
          <ChevronDown class="w-3 h-3 text-slate-500" />
        </button>

        <Transition name="fade">
          <div
            v-if="showMenu"
            class="absolute right-0 top-full mt-1 w-40 bg-slate-800 border border-slate-700 rounded-xl shadow-xl py-1 z-50"
          >
            <div class="px-3 py-2 border-b border-slate-700 mb-1">
              <p class="text-xs font-semibold text-white truncate">{{ authStore.profile?.full_name }}</p>
              <p class="text-xs text-slate-500">{{ $t('staffHeader.staff') }}</p>
            </div>
            <button
              v-if="hasMultipleViews"
              class="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-300 hover:bg-slate-700 transition-colors"
              @click="switchView"
            >
              <ArrowLeftRight class="w-4 h-4" />
              {{ $t('staffHeader.switchView') }}
            </button>
            <button
              class="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-400 hover:bg-slate-700 transition-colors"
              @click="logout"
            >
              <LogOut class="w-4 h-4" />
              {{ $t('staffHeader.signOut') }}
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
