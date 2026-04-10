import type { InventoryCategory, InventoryUnit, ProductCategory, UserRole } from '@/types'

// ============================================================
// ROLES
// ============================================================
export const ROLES: Record<UserRole, string> = {
  admin: 'Admin',
  staff: 'Staff',
  receiver: 'Receiver',
}

// ============================================================
// INVENTORY CATEGORIES
// ============================================================
export const INVENTORY_CATEGORIES: Record<InventoryCategory, { label: string; description: string; color: string }> = {
  real_stuff: {
    label: 'Real Stuff',
    description: 'Coffees, drinks, alcohol, food ingredients',
    color: 'amber',
  },
  peripherals: {
    label: 'Peripherals',
    description: 'Cups, napkins, cleaning supplies, toiletries',
    color: 'slate',
  },
}

// ============================================================
// INVENTORY UNITS
// ============================================================
export const INVENTORY_UNITS: Record<InventoryUnit, string> = {
  ml: 'ml',
  cl: 'cl',
  L: 'L',
  g: 'g',
  kg: 'kg',
  units: 'units',
}

// ============================================================
// PRODUCT CATEGORIES
// ============================================================
export const PRODUCT_CATEGORIES: Record<
  ProductCategory,
  { label: string; color: string; bgClass: string; textClass: string; dotClass: string }
> = {
  coffee: {
    label: 'Coffee',
    color: 'amber',
    bgClass: 'bg-amber-500',
    textClass: 'text-amber-700',
    dotClass: 'bg-amber-500',
  },
  beer: {
    label: 'Beer',
    color: 'yellow',
    bgClass: 'bg-yellow-500',
    textClass: 'text-yellow-700',
    dotClass: 'bg-yellow-500',
  },
  alcohol: {
    label: 'Alcohol',
    color: 'purple',
    bgClass: 'bg-purple-500',
    textClass: 'text-purple-700',
    dotClass: 'bg-purple-500',
  },
  soft_drink: {
    label: 'Soft Drink',
    color: 'blue',
    bgClass: 'bg-blue-500',
    textClass: 'text-blue-700',
    dotClass: 'bg-blue-500',
  },
  food: {
    label: 'Food',
    color: 'green',
    bgClass: 'bg-green-500',
    textClass: 'text-green-700',
    dotClass: 'bg-green-500',
  },
  other: {
    label: 'Other',
    color: 'slate',
    bgClass: 'bg-slate-500',
    textClass: 'text-slate-700',
    dotClass: 'bg-slate-500',
  },
}

// ============================================================
// STOCK STATUS COLORS
// label is now provided by i18n keys: status.ok / status.low / status.critical / status.out
// ============================================================
export const STOCK_STATUS_CONFIG = {
  ok: {
    labelKey: 'status.ok',
    bgClass: 'bg-emerald-100',
    textClass: 'text-emerald-800',
    barClass: 'bg-emerald-500',
    dotClass: 'bg-emerald-500',
    borderClass: 'border-emerald-200',
  },
  warning: {
    labelKey: 'status.low',
    bgClass: 'bg-amber-100',
    textClass: 'text-amber-800',
    barClass: 'bg-amber-500',
    dotClass: 'bg-amber-500',
    borderClass: 'border-amber-200',
  },
  critical: {
    labelKey: 'status.critical',
    bgClass: 'bg-red-100',
    textClass: 'text-red-800',
    barClass: 'bg-red-500',
    dotClass: 'bg-red-500',
    borderClass: 'border-red-200',
  },
  out: {
    labelKey: 'status.out',
    bgClass: 'bg-slate-100',
    textClass: 'text-slate-800',
    barClass: 'bg-slate-400',
    dotClass: 'bg-slate-400',
    borderClass: 'border-slate-200',
  },
}

// ============================================================
// NOTIFICATION SEVERITY COLORS
// ============================================================
export const NOTIFICATION_SEVERITY_CONFIG = {
  warning: {
    label: 'Warning',
    bgClass: 'bg-amber-50',
    textClass: 'text-amber-800',
    borderClass: 'border-amber-200',
    iconClass: 'text-amber-500',
  },
  critical: {
    label: 'Critical',
    bgClass: 'bg-red-50',
    textClass: 'text-red-800',
    borderClass: 'border-red-200',
    iconClass: 'text-red-500',
  },
}

// ============================================================
// CHART COLORS (for vue-chartjs)
// ============================================================
export const CHART_COLORS = {
  primary: 'rgb(217, 119, 6)',        // amber-600
  primaryAlpha: 'rgba(217, 119, 6, 0.15)',
  success: 'rgb(16, 185, 129)',        // emerald-500
  successAlpha: 'rgba(16, 185, 129, 0.15)',
  warning: 'rgb(245, 158, 11)',        // amber-500
  warningAlpha: 'rgba(245, 158, 11, 0.15)',
  danger: 'rgb(239, 68, 68)',          // red-500
  dangerAlpha: 'rgba(239, 68, 68, 0.15)',
  blue: 'rgb(59, 130, 246)',
  blueAlpha: 'rgba(59, 130, 246, 0.15)',
  purple: 'rgb(139, 92, 246)',
  purpleAlpha: 'rgba(139, 92, 246, 0.15)',
  multiCategory: [
    'rgb(217, 119, 6)',   // amber
    'rgb(59, 130, 246)',  // blue
    'rgb(139, 92, 246)',  // purple
    'rgb(16, 185, 129)',  // emerald
    'rgb(239, 68, 68)',   // red
    'rgb(245, 158, 11)',  // yellow
    'rgb(236, 72, 153)',  // pink
    'rgb(20, 184, 166)',  // teal
  ],
}

// ============================================================
// LOCAL STORAGE KEYS
// ============================================================
export const LS_KEYS = {
  currentShiftId: 'coffee_inv_shift_id',
  receiverShiftId: 'coffee_inv_receiver_shift_id',
  theme: 'coffee_inv_theme',
  locale: 'coffee_inv_locale',
}

// ============================================================
// ROUTE NAMES
// ============================================================
export const ROUTE_NAMES = {
  LOGIN: 'login',
  SELECT_ROLE: 'select-role',
  ADMIN_DASHBOARD: 'admin-dashboard',
  ADMIN_INVENTORY: 'admin-inventory',
  ADMIN_PRODUCTS: 'admin-products',
  ADMIN_RECIPES: 'admin-recipes',
  ADMIN_ORDERS: 'admin-orders',
  ADMIN_INVOICES: 'admin-invoices',
  ADMIN_SALES: 'admin-sales',
  ADMIN_STAFF: 'admin-staff',
  STAFF_POS: 'staff-pos',
  STAFF_CHECKLIST: 'staff-checklist',
  STAFF_MY_SHIFT: 'staff-my-shift',
  STAFF_HISTORY: 'staff-history',
  RECEIVER_QUEUE: 'receiver-queue',
  RECEIVER_POS: 'receiver-pos',
  RECEIVER_MY_SHIFT: 'receiver-my-shift',
} as const
