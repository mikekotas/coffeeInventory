<script setup lang="ts">
import { onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useShiftsStore } from '@/stores/shiftsStore'
import StaffHeader from '@/components/staff/StaffHeader.vue'
import StaffBottomNav from '@/components/staff/StaffBottomNav.vue'

const route = useRoute()
const shiftsStore = useShiftsStore()

const pageTitles: Record<string, string> = {
  'staff-pos': 'Quick Sale',
  'staff-checklist': 'Checklist',
  'staff-my-shift': 'My Shift',
  'staff-history': 'My Sales',
}

const title = () => pageTitles[route.name as string] ?? 'Coffee Inv'

onMounted(async () => {
  await shiftsStore.initialize()
})
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
