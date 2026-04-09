<script setup lang="ts">
import { useRoute } from 'vue-router'
import StaffHeader from '@/components/staff/StaffHeader.vue'
import StaffBottomNav from '@/components/staff/StaffBottomNav.vue'

const route = useRoute()

const pageTitles: Record<string, string> = {
  'staff-pos': 'Quick Sale',
  'staff-checklist': 'Checklist',
  'staff-my-shift': 'My Shift',
  'staff-history': 'My Sales',
}

const title = () => pageTitles[route.name as string] ?? 'Coffee Inv'
</script>

<template>
  <div class="min-h-screen bg-slate-950 flex flex-col">
    <StaffHeader :title="title()" />

    <main class="flex-1 overflow-auto pb-20">
      <RouterView />
    </main>

    <StaffBottomNav />
  </div>
</template>
