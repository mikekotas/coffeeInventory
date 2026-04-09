<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { useToast } from '@/composables/useToast'
import { ROUTE_NAMES } from '@/lib/constants'
import AuthLayout from '@/layouts/AuthLayout.vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppButton from '@/components/ui/AppButton.vue'

const authStore = useAuthStore()
const router = useRouter()
const toast = useToast()

const email = ref('')
const password = ref('')
const loading = ref(false)

async function handleLogin() {
  loading.value = true
  try {
    await authStore.login(email.value, password.value)
    const dest = authStore.isAdmin ? ROUTE_NAMES.ADMIN_DASHBOARD : ROUTE_NAMES.STAFF_POS
    router.push({ name: dest })
    toast.success(`Welcome back, ${authStore.profile?.full_name?.split(' ')[0]}!`)
  } catch (err: unknown) {
    toast.error('Login failed', err instanceof Error ? err.message : 'Check your credentials')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <AuthLayout>
    <h2 class="text-lg font-bold text-white mb-1">Sign in</h2>
    <p class="text-sm text-slate-400 mb-6">Enter your credentials to continue</p>

    <form class="space-y-4" @submit.prevent="handleLogin">
      <AppInput
        v-model="email"
        label="Email"
        type="email"
        placeholder="you@example.com"
        required
        autocomplete="email"
      />
      <AppInput
        v-model="password"
        label="Password"
        type="password"
        placeholder="••••••••"
        required
        autocomplete="current-password"
      />

      <AppButton type="submit" :loading="loading" full-width size="lg" class="mt-2">
        Sign In
      </AppButton>
    </form>

    <p class="text-xs text-slate-600 text-center mt-6">
      Contact your administrator to create an account.
    </p>
  </AuthLayout>
</template>
