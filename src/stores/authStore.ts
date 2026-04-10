import { defineStore, acceptHMRUpdate } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'
import type { Profile, UserRole } from '@/types'

export const useAuthStore = defineStore('auth', () => {
  const profile = ref<Profile | null>(null)
  const loading = ref(true)
  const error = ref<string | null>(null)

  const isAuthenticated = computed(() => profile.value !== null)
  const isAdmin = computed(() => profile.value?.roles?.includes('admin') ?? false)
  const isStaff = computed(() => profile.value?.roles?.includes('staff') ?? false)
  const isReceiver = computed(() => profile.value?.roles?.includes('receiver') ?? false)
  // Primary role used for redirect priority: admin > receiver > staff
  const role = computed<UserRole | null>(() => {
    if (!profile.value?.roles?.length) return null
    if (profile.value.roles.includes('admin')) return 'admin'
    if (profile.value.roles.includes('receiver')) return 'receiver'
    return 'staff'
  })

  async function fetchProfile(userId: string) {
    const { data, error: err } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (err) throw err
    profile.value = data
  }

  async function initialize() {
    loading.value = true
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        await fetchProfile(session.user.id)
      }
    } catch (err) {
      console.error('Auth init error:', err)
    } finally {
      loading.value = false
    }

    // Listen for auth changes
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        await fetchProfile(session.user.id)
      } else if (event === 'SIGNED_OUT') {
        profile.value = null
      }
    })
  }

  async function login(email: string, password: string) {
    loading.value = true
    error.value = null
    try {
      const { data, error: err } = await supabase.auth.signInWithPassword({ email, password })
      if (err) throw err
      if (data.user) {
        await fetchProfile(data.user.id)
      }
      return data
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Login failed'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function register(email: string, password: string, fullName: string, roles: UserRole[] = ['staff']) {
    loading.value = true
    error.value = null
    try {
      const { data, error: err } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName, role: roles[0] }, // trigger reads this for initial INSERT
        },
      })
      if (err) throw err
      // If multiple roles requested, update the profile after the trigger creates it
      if (data.user && roles.length > 1) {
        await supabase.from('profiles').update({ roles }).eq('id', data.user.id)
      }
      return data
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Registration failed'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function logout() {
    await supabase.auth.signOut()
    profile.value = null
  }

  async function updateProfile(updates: Partial<Pick<Profile, 'full_name' | 'avatar_url'>>) {
    if (!profile.value) return
    const { data, error: err } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', profile.value.id)
      .select()
      .single()
    if (err) throw err
    profile.value = data
  }

  async function updateStaffRoles(userId: string, newRoles: UserRole[]) {
    const { error: err } = await supabase
      .from('profiles')
      .update({ roles: newRoles })
      .eq('id', userId)
    if (err) throw err
  }

  async function fetchAllStaff(): Promise<Profile[]> {
    const { data, error: err } = await supabase
      .from('profiles')
      .select('*')
      .order('full_name')
    if (err) throw err
    return data ?? []
  }

  return {
    profile,
    loading,
    error,
    isAuthenticated,
    isAdmin,
    isStaff,
    isReceiver,
    role,
    initialize,
    login,
    register,
    logout,
    updateProfile,
    updateStaffRoles,
    fetchAllStaff,
  }
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useAuthStore, import.meta.hot))
}
