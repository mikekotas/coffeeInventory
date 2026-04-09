<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/authStore'
import { useToast } from '@/composables/useToast'
import { useFormatters } from '@/composables/useFormatters'
import type { Profile } from '@/types'
import type { UserRole } from '@/types'
import AppCard from '@/components/ui/AppCard.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppSpinner from '@/components/ui/AppSpinner.vue'
import AppEmptyState from '@/components/ui/AppEmptyState.vue'
import AppModal from '@/components/ui/AppModal.vue'
import AppInput from '@/components/ui/AppInput.vue'
import { Users, UserPlus, Shield, User } from 'lucide-vue-next'

const authStore = useAuthStore()
const toast = useToast()
const { formatDateShort } = useFormatters()

const staff = ref<Profile[]>([])
const loading = ref(false)
const showInviteModal = ref(false)
const inviteEmail = ref('')
const invitePassword = ref('')
const inviteName = ref('')
const inviting = ref(false)

onMounted(async () => {
  loading.value = true
  staff.value = await authStore.fetchAllStaff()
  loading.value = false
})

async function toggleRole(member: Profile) {
  const newRole: UserRole = member.role === 'admin' ? 'staff' : 'admin'
  try {
    await authStore.updateStaffRole(member.id, newRole)
    const idx = staff.value.findIndex(s => s.id === member.id)
    if (idx !== -1) staff.value[idx].role = newRole
    toast.success(`${member.full_name} is now ${newRole}`)
  } catch {
    toast.error('Failed to update role')
  }
}

async function handleInvite() {
  inviting.value = true
  try {
    await authStore.register(inviteEmail.value, invitePassword.value, inviteName.value)
    toast.success('Account created! User can now sign in.')
    staff.value = await authStore.fetchAllStaff()
    showInviteModal.value = false
    inviteEmail.value = ''
    invitePassword.value = ''
    inviteName.value = ''
  } catch (err: unknown) {
    toast.error('Failed to create account', err instanceof Error ? err.message : '')
  } finally {
    inviting.value = false
  }
}
</script>

<template>
  <div class="space-y-4">
    <div class="flex justify-end">
      <AppButton @click="showInviteModal = true">
        <UserPlus class="w-4 h-4" /> Add Staff Member
      </AppButton>
    </div>

    <AppCard padding="none">
      <AppSpinner v-if="loading" center />
      <AppEmptyState
        v-else-if="staff.length === 0"
        title="No staff members"
        description="Add staff members to your team"
      >
        <template #icon><Users class="w-8 h-8 text-slate-500" /></template>
      </AppEmptyState>
      <div v-else class="divide-y divide-slate-700/50">
        <div
          v-for="member in staff"
          :key="member.id"
          class="flex items-center gap-3 px-4 py-3"
        >
          <div class="w-9 h-9 bg-slate-700 rounded-xl flex items-center justify-center shrink-0">
            <span class="text-sm font-bold text-slate-300">
              {{ member.full_name?.charAt(0)?.toUpperCase() }}
            </span>
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2">
              <p class="text-sm font-medium text-white truncate">{{ member.full_name }}</p>
              <span v-if="member.id === authStore.profile?.id" class="text-xs text-slate-500">(you)</span>
            </div>
            <p class="text-xs text-slate-500">Member since {{ formatDateShort(member.created_at) }}</p>
          </div>
          <AppBadge :variant="member.role === 'admin' ? 'amber' : 'gray'" dot>
            {{ member.role === 'admin' ? 'Admin' : 'Staff' }}
          </AppBadge>
          <button
            v-if="member.id !== authStore.profile?.id"
            class="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
            :title="member.role === 'admin' ? 'Demote to staff' : 'Promote to admin'"
            @click="toggleRole(member)"
          >
            <component :is="member.role === 'admin' ? User : Shield" class="w-4 h-4" />
          </button>
        </div>
      </div>
    </AppCard>

    <!-- Invite Modal -->
    <AppModal :open="showInviteModal" title="Add Staff Member" @close="showInviteModal = false">
      <form class="space-y-4" @submit.prevent="handleInvite">
        <AppInput v-model="inviteName" label="Full Name" placeholder="Jane Smith" required />
        <AppInput v-model="inviteEmail" type="email" label="Email" placeholder="jane@shop.com" required />
        <AppInput v-model="invitePassword" type="password" label="Password" placeholder="min. 6 characters" required />
        <div class="flex gap-2 pt-1">
          <AppButton variant="ghost" type="button" full-width @click="showInviteModal = false">Cancel</AppButton>
          <AppButton type="submit" :loading="inviting" full-width>Create Account</AppButton>
        </div>
      </form>
    </AppModal>
  </div>
</template>
