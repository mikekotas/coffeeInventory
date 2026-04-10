<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { useToast } from '@/composables/useToast'
import { ROUTE_NAMES } from '@/lib/constants'
import { useI18n } from 'vue-i18n'
import AuthLayout from '@/layouts/AuthLayout.vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppButton from '@/components/ui/AppButton.vue'

const authStore = useAuthStore()
const router = useRouter()
const toast = useToast()
const { t } = useI18n()

const email = ref('')
const password = ref('')
const loading = ref(false)

async function handleLogin() {
  loading.value = true
  try {
    await authStore.login(email.value, password.value)
    const dest = authStore.isAdmin ? ROUTE_NAMES.ADMIN_DASHBOARD : ROUTE_NAMES.STAFF_POS
    router.push({ name: dest })
    toast.success(`${t('auth.signIn')} — ${authStore.profile?.full_name?.split(' ')[0]}!`)
  } catch (err: unknown) {
    toast.error(t('auth.signIn'), err instanceof Error ? err.message : '')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <AuthLayout>
    <h2 class="text-lg font-bold text-white mb-1">{{ $t('auth.signIn') }}</h2>
    <p class="text-sm text-slate-400 mb-6">{{ $t('auth.tagline') }}</p>

    <form class="space-y-4" @submit.prevent="handleLogin">
      <AppInput
        v-model="email"
        :label="$t('auth.email')"
        type="email"
        :placeholder="$t('auth.emailPlaceholder')"
        required
        autocomplete="email"
      />
      <AppInput
        v-model="password"
        :label="$t('auth.password')"
        type="password"
        :placeholder="$t('auth.passwordPlaceholder')"
        required
        autocomplete="current-password"
      />

      <AppButton type="submit" :loading="loading" full-width size="lg" class="mt-2">
        {{ $t('auth.signInBtn') }}
      </AppButton>
    </form>

    <p class="text-xs text-slate-600 text-center mt-6">
      {{ $t('auth.noAccount') }}
    </p>
  </AuthLayout>
</template>
