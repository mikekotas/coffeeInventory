import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import { ROUTE_NAMES } from '@/lib/constants'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    // ── Auth ──
    {
      path: '/login',
      name: ROUTE_NAMES.LOGIN,
      component: () => import('@/pages/auth/Login.vue'),
      meta: { layout: 'auth', requiresGuest: true },
    },

    // ── Admin ──
    {
      path: '/admin',
      component: () => import('@/layouts/AdminLayout.vue'),
      meta: { requiresAuth: true, requiresAdmin: true },
      redirect: { name: ROUTE_NAMES.ADMIN_DASHBOARD },
      children: [
        {
          path: 'dashboard',
          name: ROUTE_NAMES.ADMIN_DASHBOARD,
          component: () => import('@/pages/admin/Dashboard.vue'),
        },
        {
          path: 'inventory',
          name: ROUTE_NAMES.ADMIN_INVENTORY,
          component: () => import('@/pages/admin/Inventory.vue'),
        },
        {
          path: 'products',
          name: ROUTE_NAMES.ADMIN_PRODUCTS,
          component: () => import('@/pages/admin/Products.vue'),
        },
        {
          path: 'recipes',
          name: ROUTE_NAMES.ADMIN_RECIPES,
          component: () => import('@/pages/admin/Recipes.vue'),
        },
        {
          path: 'orders',
          name: ROUTE_NAMES.ADMIN_ORDERS,
          component: () => import('@/pages/admin/Orders.vue'),
        },
        {
          path: 'invoices',
          name: ROUTE_NAMES.ADMIN_INVOICES,
          component: () => import('@/pages/admin/Invoices.vue'),
        },
        {
          path: 'sales',
          name: ROUTE_NAMES.ADMIN_SALES,
          component: () => import('@/pages/admin/Sales.vue'),
        },
        {
          path: 'staff',
          name: ROUTE_NAMES.ADMIN_STAFF,
          component: () => import('@/pages/admin/Staff.vue'),
        },
      ],
    },

    // ── Staff ──
    {
      path: '/staff',
      component: () => import('@/layouts/StaffLayout.vue'),
      meta: { requiresAuth: true, requiresStaff: true },
      redirect: { name: ROUTE_NAMES.STAFF_POS },
      children: [
        {
          path: 'pos',
          name: ROUTE_NAMES.STAFF_POS,
          component: () => import('@/pages/staff/POS.vue'),
        },
        {
          path: 'checklist',
          name: ROUTE_NAMES.STAFF_CHECKLIST,
          component: () => import('@/pages/staff/Checklist.vue'),
        },
        {
          path: 'my-shift',
          name: ROUTE_NAMES.STAFF_MY_SHIFT,
          component: () => import('@/pages/staff/MyShift.vue'),
        },
        {
          path: 'history',
          name: ROUTE_NAMES.STAFF_HISTORY,
          component: () => import('@/pages/staff/History.vue'),
        },
      ],
    },

    // ── Receiver ──
    {
      path: '/receiver',
      component: () => import('@/layouts/ReceiverLayout.vue'),
      meta: { requiresAuth: true, requiresReceiver: true },
      redirect: { name: ROUTE_NAMES.RECEIVER_QUEUE },
      children: [
        {
          path: 'queue',
          name: ROUTE_NAMES.RECEIVER_QUEUE,
          component: () => import('@/pages/receiver/Queue.vue'),
        },
        {
          path: 'pos',
          name: ROUTE_NAMES.RECEIVER_POS,
          component: () => import('@/pages/receiver/POS.vue'),
        },
        {
          path: 'my-shift',
          name: ROUTE_NAMES.RECEIVER_MY_SHIFT,
          component: () => import('@/pages/receiver/MyShift.vue'),
        },
      ],
    },

    // ── Root redirect ──
    {
      path: '/',
      redirect: () => {
        // Will be handled by navigation guard
        return { name: ROUTE_NAMES.LOGIN }
      },
    },

    // ── 404 ──
    {
      path: '/:pathMatch(.*)*',
      redirect: { name: ROUTE_NAMES.LOGIN },
    },
  ],
})

// Navigation guard
router.beforeEach(async (to) => {
  const authStore = useAuthStore()

  // Wait for auth to initialize
  if (authStore.loading) {
    await new Promise<void>(resolve => {
      const unwatch = setInterval(() => {
        if (!authStore.loading) {
          clearInterval(unwatch)
          resolve()
        }
      }, 50)
    })
  }

  const isAuthenticated = authStore.isAuthenticated
  const isAdmin = authStore.isAdmin
  const isReceiver = authStore.isReceiver

  // Helper: redirect to the user's role-appropriate home
  const roleHome = () => {
    if (isAdmin) return { name: ROUTE_NAMES.ADMIN_DASHBOARD }
    if (isReceiver) return { name: ROUTE_NAMES.RECEIVER_QUEUE }
    return { name: ROUTE_NAMES.STAFF_POS }
  }

  // Redirect guests away from auth pages
  if (to.meta.requiresGuest && isAuthenticated) {
    return roleHome()
  }

  // Require auth
  if (to.meta.requiresAuth && !isAuthenticated) {
    return { name: ROUTE_NAMES.LOGIN }
  }

  // Require admin role — redirect non-admins to their home
  if (to.meta.requiresAdmin && !isAdmin) {
    return roleHome()
  }

  // Require receiver role — only receivers (and admins for debugging) can access
  if (to.meta.requiresReceiver && !isReceiver && !isAdmin) {
    return roleHome()
  }

  // Require staff role — redirect non-staff to their home
  if (to.meta.requiresStaff && !authStore.isStaff && !isAdmin) {
    return roleHome()
  }

  // Root redirect for authenticated users
  if (to.path === '/' && isAuthenticated) {
    return roleHome()
  }
})

export default router
