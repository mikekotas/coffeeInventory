<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuthStore } from '@/stores/authStore'
import { useToast } from '@/composables/useToast'
import { useFormatters } from '@/composables/useFormatters'
import { useI18n } from 'vue-i18n'
import type { Profile } from '@/types'
import type { UserRole } from '@/types'
import AppCard from '@/components/ui/AppCard.vue'
import AppBadge from '@/components/ui/AppBadge.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppSpinner from '@/components/ui/AppSpinner.vue'
import AppEmptyState from '@/components/ui/AppEmptyState.vue'
import AppModal from '@/components/ui/AppModal.vue'
import AppInput from '@/components/ui/AppInput.vue'
import { Users, UserPlus } from 'lucide-vue-next'

const authStore = useAuthStore()
const toast = useToast()
const { formatDateShort } = useFormatters()
const { t } = useI18n()

const ALL_ROLES: UserRole[] = ['admin', 'staff', 'receiver']

const staff = ref<Profile[]>([])
const loading = ref(false)
const showInviteModal = ref(false)
const inviteEmail = ref('')
const invitePassword = ref('')
const inviteName = ref('')
const inviteRoles = ref<UserRole[]>(['staff'])
const inviting = ref(false)
const savingRoles = ref<Record<string, boolean>>({})

onMounted(async () => {
  loading.value = true
  staff.value = await authStore.fetchAllStaff()
  loading.value = false
})

async function updateRoles(member: Profile, updatedRoles: UserRole[]) {
  if (updatedRoles.length === 0) {
    toast.error(t('staff.atLeastOneRole'))
    return
  }
  savingRoles.value[member.id] = true
  try {
    await authStore.updateStaffRoles(member.id, updatedRoles)
    const idx = staff.value.findIndex(s => s.id === member.id)
    if (idx !== -1) staff.value[idx].roles = updatedRoles
    toast.success(t('staff.rolesUpdated', { name: member.full_name }))
  } catch {
    toast.error(t('staff.roleUpdateFailed'))
  } finally {
    delete savingRoles.value[member.id]
  }
}

async function handleInvite() {
  inviting.value = true
  try {
    await authStore.register(inviteEmail.value, invitePassword.value, inviteName.value, inviteRoles.value)
    toast.success(t('staff.accountCreated'))
    staff.value = await authStore.fetchAllStaff()
    showInviteModal.value = false
    inviteEmail.value = ''
    invitePassword.value = ''
    inviteName.value = ''
    inviteRoles.value = ['staff']
  } catch (err: unknown) {
    toast.error(t('staff.createFailed'), err instanceof Error ? err.message : '')
  } finally {
    inviting.value = false
  }
}
</script>

<template>
  <div class="space-y-4">
    <div class="flex justify-end">
      <AppButton @click="showInviteModal = true">
        <UserPlus class="w-4 h-4" /> {{ t('staff.addStaff') }}
      </AppButton>
    </div>

    <AppCard padding="none">
      <AppSpinner v-if="loading" center />
      <AppEmptyState
        v-else-if="staff.length === 0"
        :title="t('staff.noStaff')"
        :description="t('staff.noStaffDesc')"
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
            <div class="flex items-center gap-2 flex-wrap">
              <p class="text-sm font-medium text-white truncate">{{ member.full_name }}</p>
              <span v-if="member.id === authStore.profile?.id" class="text-xs text-slate-500">{{ t('staff.you') }}</span>
              <AppBadge
                v-for="r in member.roles"
                :key="r"
                :variant="r === 'admin' ? 'amber' : r === 'receiver' ? 'blue' : 'gray'"
                dot
              >
                {{ r }}
              </AppBadge>
            </div>
            <p class="text-xs text-slate-500">{{ t('staff.memberSince', { date: formatDateShort(member.created_at) }) }}</p>
          </div>
          <!-- Role checkboxes — disabled for the currently logged-in admin -->
          <div
            class="flex items-center gap-3"
            :class="{ 'opacity-40 pointer-events-none': member.id === authStore.profile?.id }"
          >
            <label
              v-for="r in ALL_ROLES"
              :key="r"
              class="flex items-center gap-1.5 cursor-pointer select-none"
            >
              <input
                type="checkbox"
                :checked="member.roles.includes(r)"
                :disabled="!!savingRoles[member.id]"
                class="rounded border-slate-600 bg-slate-700 text-brand-500 focus:ring-brand-500"
                @change="updateRoles(member, member.roles.includes(r)
                  ? member.roles.filter(x => x !== r)
                  : [...member.roles, r]
                )"
              />
              <span class="text-xs text-slate-400 capitalize">{{ r }}</span>
            </label>
            <AppSpinner v-if="savingRoles[member.id]" class="w-4 h-4" />
          </div>
        </div>
      </div>
    </AppCard>

    <!-- Add Staff Modal -->
    <AppModal :open="showInviteModal" :title="t('staff.addStaff')" @close="showInviteModal = false">
      <form class="space-y-4" @submit.prevent="handleInvite">
        <AppInput v-model="inviteName" :label="t('staff.fullName')" :placeholder="t('staff.fullNamePlaceholder')" required />
        <AppInput v-model="inviteEmail" type="email" :label="t('common.name')" :placeholder="t('staff.emailPlaceholder')" required />
        <AppInput v-model="invitePassword" type="password" :label="t('auth.password')" :placeholder="t('staff.passwordPlaceholder')" required />
        <div class="flex flex-col gap-2">
          <label class="text-sm font-medium text-slate-300">{{ t('staff.roles') }}</label>
          <div class="flex gap-4">
            <label
              v-for="r in ALL_ROLES"
              :key="r"
              class="flex items-center gap-2 cursor-pointer select-none"
            >
              <input
                type="checkbox"
                :value="r"
                v-model="inviteRoles"
                class="rounded border-slate-600 bg-slate-700 text-brand-500 focus:ring-brand-500"
              />
              <span class="text-sm text-slate-300 capitalize">{{ r }}</span>
            </label>
          </div>
          <p class="text-xs text-slate-500">{{ t('staff.atLeastOneRole') }}</p>
        </div>
        <div class="flex gap-2 pt-1">
          <AppButton variant="ghost" type="button" full-width @click="showInviteModal = false">{{ t('common.cancel') }}</AppButton>
          <AppButton type="submit" :loading="inviting" :disabled="inviting || inviteRoles.length === 0" full-width>
            {{ t('staff.createAccount') }}
          </AppButton>
        </div>
      </form>
    </AppModal>
  </div>
</template>
