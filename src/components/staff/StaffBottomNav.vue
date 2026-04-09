<script setup lang="ts">
import { useRoute, RouterLink } from 'vue-router'
import { useOrdersStore } from '@/stores/ordersStore'
import { ROUTE_NAMES } from '@/lib/constants'
import { ShoppingCart, CheckSquare, Clock, History } from 'lucide-vue-next'

const route = useRoute()
const ordersStore = useOrdersStore()

const navItems = [
  { name: ROUTE_NAMES.STAFF_POS, label: 'POS', icon: ShoppingCart },
  { name: ROUTE_NAMES.STAFF_CHECKLIST, label: 'Checklist', icon: CheckSquare },
  { name: ROUTE_NAMES.STAFF_MY_SHIFT, label: 'My Shift', icon: Clock },
  { name: ROUTE_NAMES.STAFF_HISTORY, label: 'History', icon: History },
]

const isActive = (routeName: string) => route.name === routeName
</script>

<template>
  <nav class="fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur border-t border-slate-800 z-30 safe-area-pb">
    <div class="flex items-center justify-around px-2 py-1">
      <RouterLink
        v-for="item in navItems"
        :key="item.name"
        :to="{ name: item.name }"
        :class="[
          'flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-colors min-w-[60px] relative',
          isActive(item.name) ? 'text-brand-400' : 'text-slate-500',
        ]"
      >
        <component :is="item.icon" :class="['w-5 h-5', isActive(item.name) ? 'text-brand-400' : '']" />
        <span class="text-xs font-medium">{{ item.label }}</span>
        <!-- Badge for checklist if draft order has items -->
        <span
          v-if="item.name === ROUTE_NAMES.STAFF_CHECKLIST && ordersStore.draftItemCount > 0"
          class="absolute top-1.5 right-2 min-w-[16px] h-4 flex items-center justify-center text-xs font-bold bg-brand-500 text-white rounded-full px-1"
        >
          {{ ordersStore.draftItemCount }}
        </span>
      </RouterLink>
    </div>
  </nav>
</template>
