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
      meta: { requiresAuth: true },
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

  // Redirect guests away from auth pages
  if (to.meta.requiresGuest && isAuthenticated) {
    return isAdmin
      ? { name: ROUTE_NAMES.ADMIN_DASHBOARD }
      : { name: ROUTE_NAMES.STAFF_POS }
  }

  // Require auth
  if (to.meta.requiresAuth && !isAuthenticated) {
    return { name: ROUTE_NAMES.LOGIN }
  }

  // Require admin role
  if (to.meta.requiresAdmin && !isAdmin) {
    return { name: ROUTE_NAMES.STAFF_POS }
  }

  // Root redirect for authenticated users
  if (to.path === '/' && isAuthenticated) {
    return isAdmin
      ? { name: ROUTE_NAMES.ADMIN_DASHBOARD }
      : { name: ROUTE_NAMES.STAFF_POS }
  }
})

export default router
