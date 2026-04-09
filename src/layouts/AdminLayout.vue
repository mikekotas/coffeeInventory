<script setup lang="ts">
import { useRoute } from 'vue-router'
import AdminSidebar from '@/components/admin/AdminSidebar.vue'
import AdminHeader from '@/components/admin/AdminHeader.vue'

const route = useRoute()

const pageTitles: Record<string, string> = {
  'admin-dashboard': 'Dashboard',
  'admin-inventory': 'Inventory',
  'admin-products': 'Products',
  'admin-recipes': 'Recipes',
  'admin-orders': 'Orders',
  'admin-invoices': 'Invoices',
  'admin-sales': 'Sales Analytics',
  'admin-staff': 'Staff Management',
}

const title = () => pageTitles[route.name as string] ?? 'Admin'
</script>

<template>
  <div class="min-h-screen bg-slate-950 flex">
    <AdminSidebar />

    <div class="flex-1 flex flex-col min-w-0">
      <AdminHeader :title="title()" />

      <main class="flex-1 p-4 lg:p-6 overflow-auto">
        <RouterView />
      </main>
    </div>
  </div>
</template>
