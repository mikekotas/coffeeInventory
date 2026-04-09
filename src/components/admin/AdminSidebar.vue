<script setup lang="ts">
import { useRoute, RouterLink } from 'vue-router'
import { useNotificationsStore } from '@/stores/notificationsStore'
import { ROUTE_NAMES } from '@/lib/constants'
import {
  LayoutDashboard, Package, ShoppingBag, BookOpen, ClipboardList,
  Receipt, BarChart3, Users, Coffee
} from 'lucide-vue-next'

const route = useRoute()
const notificationsStore = useNotificationsStore()

const navItems = [
  { name: ROUTE_NAMES.ADMIN_DASHBOARD, label: 'Dashboard', icon: LayoutDashboard },
  { name: ROUTE_NAMES.ADMIN_INVENTORY, label: 'Inventory', icon: Package },
  { name: ROUTE_NAMES.ADMIN_PRODUCTS, label: 'Products', icon: ShoppingBag },
  { name: ROUTE_NAMES.ADMIN_RECIPES, label: 'Recipes', icon: BookOpen },
  { name: ROUTE_NAMES.ADMIN_ORDERS, label: 'Orders', icon: ClipboardList },
  { name: ROUTE_NAMES.ADMIN_INVOICES, label: 'Invoices', icon: Receipt },
  { name: ROUTE_NAMES.ADMIN_SALES, label: 'Sales', icon: BarChart3 },
  { name: ROUTE_NAMES.ADMIN_STAFF, label: 'Staff', icon: Users },
]

const isActive = (routeName: string) => route.name === routeName
</script>

<template>
  <aside class="hidden lg:flex flex-col w-56 bg-slate-900 border-r border-slate-800 min-h-screen">
    <!-- Logo -->
    <div class="flex items-center gap-2.5 px-5 py-5 border-b border-slate-800">
      <div class="w-8 h-8 bg-brand-600 rounded-xl flex items-center justify-center">
        <Coffee class="w-4 h-4 text-white" />
      </div>
      <div>
        <span class="font-bold text-white text-sm">Coffee Inv</span>
        <p class="text-xs text-slate-500">Admin Panel</p>
      </div>
    </div>

    <!-- Nav -->
    <nav class="flex-1 px-2 py-3 space-y-0.5">
      <RouterLink
        v-for="item in navItems"
        :key="item.name"
        :to="{ name: item.name }"
        :class="[
          'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors relative',
          isActive(item.name)
            ? 'bg-brand-600/20 text-brand-400'
            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800',
        ]"
      >
        <component :is="item.icon" class="w-4 h-4 shrink-0" />
        {{ item.label }}
        <!-- Notification badge on Dashboard -->
        <span
          v-if="item.name === ROUTE_NAMES.ADMIN_DASHBOARD && notificationsStore.unreadCount > 0"
          class="absolute right-2 top-1/2 -translate-y-1/2 min-w-[18px] h-[18px] flex items-center justify-center text-xs font-bold bg-red-500 text-white rounded-full px-1"
        >
          {{ notificationsStore.unreadCount > 99 ? '99+' : notificationsStore.unreadCount }}
        </span>
      </RouterLink>
    </nav>
  </aside>
</template>
