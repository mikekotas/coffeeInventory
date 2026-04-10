<script setup lang="ts">
import { onMounted } from 'vue'
import { useNotificationsStore } from '@/stores/notificationsStore'
import { useFormatters } from '@/composables/useFormatters'
import { useI18n } from 'vue-i18n'
import { AlertTriangle, AlertCircle, X, CheckCheck } from 'lucide-vue-next'
import AppSpinner from '@/components/ui/AppSpinner.vue'
import AppEmptyState from '@/components/ui/AppEmptyState.vue'

const { t } = useI18n()

const emit = defineEmits<{ close: [] }>()

const store = useNotificationsStore()
const { formatRelative } = useFormatters()

onMounted(() => store.fetchAll())
</script>

<template>
  <div class="absolute right-0 top-full mt-2 w-80 bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl z-50 overflow-hidden">
    <!-- Header -->
    <div class="flex items-center justify-between px-4 py-3 border-b border-slate-700">
      <div class="flex items-center gap-2">
        <h3 class="font-semibold text-white text-sm">{{ t('notifications.title') }}</h3>
        <span
          v-if="store.unreadCount > 0"
          class="bg-red-500 text-white text-xs font-bold rounded-full px-1.5 py-0.5 min-w-[20px] text-center"
        >
          {{ store.unreadCount }}
        </span>
      </div>
      <div class="flex items-center gap-1">
        <button
          v-if="store.unreadCount > 0"
          class="text-xs text-brand-400 hover:text-brand-300 px-2 py-1 rounded-lg hover:bg-slate-700 transition-colors"
          @click="store.markAllRead()"
        >
          <CheckCheck class="w-4 h-4" />
        </button>
        <button
          class="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          @click="emit('close')"
        >
          <X class="w-4 h-4" />
        </button>
      </div>
    </div>

    <!-- List -->
    <div class="max-h-80 overflow-y-auto">
      <AppSpinner v-if="store.loading" center />
      <AppEmptyState
        v-else-if="store.notifications.length === 0"
        :title="t('notifications.noNotifications')"
        :description="t('notifications.allClear')"
      />
      <div v-else>
        <div
          v-for="n in store.notifications.slice(0, 20)"
          :key="n.id"
          :class="[
            'flex items-start gap-3 px-4 py-3 border-b border-slate-700/50 transition-colors cursor-pointer',
            n.status === 'unread' ? 'bg-slate-750/50' : 'opacity-70',
            'hover:bg-slate-700/40',
          ]"
          @click="store.markRead(n.id)"
        >
          <component
            :is="n.severity === 'critical' ? AlertCircle : AlertTriangle"
            :class="['w-4 h-4 shrink-0 mt-0.5', n.severity === 'critical' ? 'text-red-400' : 'text-amber-400']"
          />
          <div class="flex-1 min-w-0">
            <p class="text-xs text-slate-200 leading-snug">{{ n.message }}</p>
            <p class="text-xs text-slate-500 mt-0.5">{{ formatRelative(n.created_at) }}</p>
          </div>
          <div
            v-if="n.status === 'unread'"
            class="w-1.5 h-1.5 rounded-full bg-brand-500 shrink-0 mt-1.5"
          />
        </div>
      </div>
    </div>
  </div>
</template>
