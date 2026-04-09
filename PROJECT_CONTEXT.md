# Coffee Inventory Pro — AI Agent Context File

> Paste this file at the start of any AI session to get full project context.
> Last updated: 2026-04-10 (rev 4)

---

## 1. Project Overview

A **mobile-first PWA** for coffee shop POS and inventory management.

**Three roles (multi-role supported — one user can hold multiple roles simultaneously):**
- **Admin** — Full dashboard: inventory CRUD, product/recipe management, sales analytics (charts), orders management, invoice tracking, staff management. Has quick "Switch View" links to Staff and Receiver views
- **Staff** — POS quick-sale grid, inventory checklist with draft order button, shift management, personal sales history
- **Receiver** — Real-time order queue (Kitchen Display System), mark orders complete, integrated POS with own shift tracking

**Role selection UX:**
- Single-role users land directly on their view after login
- Multi-role non-admin users (e.g. staff + receiver) land on `/select-role` — a picker page to choose which view to enter
- Multi-role users can switch views via a "Switch View" button in their layout header without logging out

**Core business logic (all in DB):**
- Selling a product automatically deducts its recipe ingredients from inventory (PostgreSQL trigger)
- If stock drops below thresholds, notifications are created and items are auto-added to the draft order
- Staff can also manually add items to the draft order via the Checklist page
- Admin reviews and finalizes draft orders

**Infrastructure:** 100% free-tier. Supabase (DB + Auth + Realtime + Edge Functions) + Vercel (hosting).

---

## 2. Tech Stack

| Layer | Tool | Version |
|---|---|---|
| Framework | Vue 3 (Composition API, `<script setup>`) | ^3.4 |
| Build | Vite | ^5.3 |
| Language | TypeScript | ^5.4 |
| Styling | Tailwind CSS + @tailwindcss/forms | ^3.4 |
| State | Pinia | ^2.1 |
| Router | Vue Router 4 | ^4.3 |
| Backend/DB | Supabase (PostgreSQL + Auth + Realtime) | ^2.43 |
| Edge Functions | Supabase Edge Functions (Deno runtime) | — |
| Charts | vue-chartjs + chart.js | ^5.3 / ^4.4 |
| Icons | lucide-vue-next | ^0.378 |
| Utilities | @vueuse/core, date-fns | ^10.11 / ^3.6 |
| Forms | vee-validate + zod | ^4.13 / ^3.23 |
| PWA | vite-plugin-pwa + workbox | ^0.20 |
| Hosting | Vercel | — |

---

## 3. Environment Setup

### Local dev
```bash
npm install
cp .env.example .env   # fill in your Supabase credentials
npm run dev            # http://localhost:5173
npm run build          # production build
```

### `.env` variables
```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

---

## 4. Supabase Project Setup (one-time)

Run in **Supabase SQL Editor** in this exact order:

1. `supabase/migrations/001_initial_schema.sql` — All tables, triggers, functions, RLS policies
2. `supabase/migrations/002_seed_data.sql` — 31 inventory items + 32 products + full recipes
3. `supabase/migrations/003_fix_rls_policies.sql` — RLS patch (fixes INSERT WITH CHECK bug)
4. `supabase/migrations/004_fix_bugs.sql` — Trigger rewrite + order_items draft update policy
5. `supabase/migrations/005_orders_delivery.sql` — Adds `delivered` status, `name` on orders, `received`/`received_at` on order_items
6. `supabase/migrations/006_fix_orders_rls.sql` — Allows order creator (staff) to update their own draft order (needed for saving order name)
7. `supabase/migrations/007_add_sale_type_and_table.sql` — Adds `sale_type` + `table_identifier` to sales
8. `supabase/migrations/008_staff_draft_deletion.sql` — RLS: staff can delete own draft order items
9. `supabase/migrations/009_add_payment_method.sql` — Adds `payment_method` to sales
10. `supabase/migrations/010_general_notifications.sql` — General notifications improvements
11. `supabase/migrations/011_receiver_view.sql` — Adds `receiver` role, `completed_at` on sales, receiver RLS policies
    > **Note:** Run `ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'receiver';` FIRST (alone), then run the rest of the file
12. `supabase/migrations/012_multi_role.sql` — Multi-role support: replaces `profiles.role` with `profiles.roles user_role[]`, rewrites `is_admin()` / `is_receiver()` / `handle_new_user()` trigger, adds GIN index and not-empty constraint

### Auth setup
- Go to Supabase Dashboard → Authentication → Enable **Email** provider
- Create first admin user via Dashboard → Auth → Users → Add User
- Promote to admin via SQL Editor (uses array syntax after migration 012):
  ```sql
  UPDATE profiles SET roles = ARRAY['admin']::user_role[] WHERE id = '<user-uuid>';
  ```
- Assign multiple roles to one user:
  ```sql
  UPDATE profiles SET roles = ARRAY['staff','receiver']::user_role[] WHERE id = '<user-uuid>';
  ```
- All subsequent users created via the Admin Staff page get their chosen role(s) automatically
- **User creation is done via the Admin UI** (Staff page → Add Staff Member) — no need to visit Supabase dashboard

> **Note:** Edge Functions (`process-sale`, `finalize-order`) exist in `supabase/functions/` but are **not used** — both operations use direct Supabase client calls (see Fix A3).

---

## 5. File Structure

```
coffeeInventory/
├── PROJECT_CONTEXT.md          ← this file
├── .env.example
├── package.json
├── vite.config.ts              ← PWA plugin, path alias @ → src/
├── tailwind.config.js          ← brand amber colors, custom animations
├── vercel.json                 ← SPA rewrite: all routes → index.html
├── index.html                  ← PWA meta tags, theme color
├── public/
│   └── manifest.webmanifest
│
├── supabase/
│   ├── migrations/
│   │   ├── 001_initial_schema.sql       ← full schema + triggers + RLS
│   │   ├── 002_seed_data.sql            ← seed products + inventory + recipes
│   │   ├── 003_fix_rls_policies.sql     ← RLS INSERT patch (MUST run)
│   │   ├── 004_fix_bugs.sql             ← trigger rewrite + order_items draft policy
│   │   ├── 005_orders_delivery.sql      ← delivery tracking: name, received, delivered status
│   │   ├── 006_fix_orders_rls.sql       ← allow staff to update their own draft order name
│   │   ├── 007_add_sale_type_and_table.sql ← sale_type + table_identifier on sales
│   │   ├── 008_staff_draft_deletion.sql ← staff can delete own draft order items
│   │   ├── 009_add_payment_method.sql   ← payment_method on sales
│   │   ├── 010_general_notifications.sql ← notifications improvements
│   │   ├── 011_receiver_view.sql        ← receiver role + completed_at on sales + RLS
│   │   └── 012_multi_role.sql           ← roles[] array column, GIN index, updated is_admin/is_receiver/trigger
│   └── functions/
│       ├── process-sale/index.ts    ← Edge Function (unused — logic moved to posStore directly)
│       └── finalize-order/index.ts  ← Edge Function (unused — logic moved to ordersStore directly)
│
└── src/
    ├── main.ts                 ← createApp + Pinia + Router + mount
    ├── App.vue                 ← loading gate (auth.initialize) + RouterView + AppToast + AppConfirm
    ├── vite-env.d.ts           ← ImportMetaEnv interface (fixes TS env errors)
    │
    ├── types/
    │   └── index.ts            ← All TypeScript interfaces + getStockStatus() utility
    │
    ├── lib/
    │   ├── supabase.ts         ← createClient<any> + callEdgeFunction() helper
    │   └── constants.ts        ← ROUTE_NAMES, PRODUCT_CATEGORIES, STOCK_STATUS_CONFIG,
    │                              CHART_COLORS, LS_KEYS
    │
    ├── router/
    │   └── index.ts            ← All routes + beforeEach auth/role guard
    │
    ├── stores/
    │   ├── authStore.ts        ← session, profile, role, login/logout/register, staff management
    │   ├── inventoryStore.ts   ← inventory CRUD + realtime subscription
    │   ├── productsStore.ts    ← product CRUD + recipe management
    │   ├── salesStore.ts       ← fetch sales, daily revenue RPC, top products RPC, subscribeRealtime()
    │   ├── ordersStore.ts      ← draft order flow, addItem, removeItem, finalizeOrder
    │   ├── notificationsStore.ts ← fetch alerts, markRead, realtime subscription
    │   ├── shiftsStore.ts      ← start/end shift, localStorage persistence (key: coffee_inv_shift_id)
    │   ├── posStore.ts         ← cart state, confirmSale (optional shiftIdOverride param)
    │   ├── invoicesStore.ts    ← invoice CRUD + Supabase Storage file upload
    │   ├── receiverStore.ts    ← pendingQueue, recentCompleted, markComplete, subscribeRealtime
    │   └── receiverShiftsStore.ts ← copy of shiftsStore for receiver (key: coffee_inv_receiver_shift_id) + fetchAllActive()
    │
    ├── composables/
    │   ├── useToast.ts         ← singleton toast system (success/error/warning/info)
    │   ├── useConfirm.ts       ← singleton Promise-based confirm dialog
    │   ├── useFormatters.ts    ← formatCurrency (el-GR EUR), formatDate, formatRelative
    │   └── useRealtime.ts      ← useAdminRealtime() and useStaffRealtime() composables
    │
    ├── assets/
    │   └── main.css            ← Tailwind directives, safe-area padding, scrollbar styles
    │
    ├── layouts/
    │   ├── AuthLayout.vue      ← centered card with ambient glow
    │   ├── AdminLayout.vue     ← AdminSidebar + AdminHeader + RouterView
    │   ├── StaffLayout.vue     ← StaffHeader + RouterView + StaffBottomNav (pb-20)
    │   └── ReceiverLayout.vue  ← ReceiverHeader + RouterView + bottom nav (Queue/POS/MyShift)
    │
    ├── components/
    │   ├── admin/
    │   │   ├── AdminSidebar.vue      ← 8 nav items, notification badge
    │   │   └── AdminHeader.vue       ← notification bell, user dropdown, logout
    │   ├── staff/
    │   │   ├── StaffBottomNav.vue    ← 4 tabs: POS/Checklist/MyShift/History
    │   │   └── StaffHeader.vue       ← shift status pill (green pulse when active)
    │   ├── ui/                       ← reusable component library
    │   │   ├── AppButton.vue         ← 5 variants, 4 sizes, loading spinner
    │   │   ├── AppCard.vue
    │   │   ├── AppBadge.vue          ← 7 color variants
    │   │   ├── AppInput.vue
    │   │   ├── AppSelect.vue
    │   │   ├── AppModal.vue          ← Teleport to body, Escape key, transitions
    │   │   ├── AppDrawer.vue         ← right or bottom side drawer
    │   │   ├── AppToast.vue          ← TransitionGroup with slide-in animation
    │   │   ├── AppSpinner.vue
    │   │   ├── AppStatCard.vue       ← KPI card with icon slot + trend
    │   │   ├── AppTabs.vue
    │   │   ├── AppEmptyState.vue
    │   │   └── AppConfirm.vue
    │   ├── inventory/
    │   │   ├── ThresholdBadge.vue    ← ok/warning/critical colored badge
    │   │   ├── StockBar.vue          ← visual stock level bar with threshold markers
    │   │   └── InventoryForm.vue     ← create/edit inventory item form
    │   ├── pos/
    │   │   ├── ProductButton.vue     ← emoji by category, cart qty badge
    │   │   ├── SaleCart.vue          ← right drawer, qty controls, confirm sale
    │   │   └── ShiftBanner.vue       ← shows shift duration or "Start Shift" prompt
    │   ├── checklist/
    │   │   ├── ChecklistItem.vue     ← item row with "+ Order" button
    │   │   └── OrderDraftPanel.vue   ← bottom drawer: order name input + draft items + qty controls
    │   ├── receiver/
    │   │   └── OrderCard.vue         ← order card: items, table/takeaway badge, payment icon, complete btn
    │   ├── charts/
    │   │   ├── RevenueChart.vue      ← Line chart (daily revenue)
    │   │   ├── TopProductsChart.vue  ← Doughnut chart
    │   │   ├── SalesShiftChart.vue   ← Bar chart (per shift)
    │   │   └── StockLevelChart.vue   ← Horizontal bar (top 12 lowest stock items)
    │   ├── recipes/
    │   │   └── RecipeBuilder.vue     ← ingredient list, inline qty edit, add ingredient
    │   ├── notifications/
    │   │   └── NotificationList.vue  ← dropdown with mark-read
    │   └── invoices/
    │       └── InvoiceForm.vue       ← with file input for PDF upload
    │
    └── pages/
        ├── auth/
        │   └── Login.vue
        ├── admin/
        │   ├── Dashboard.vue   ← KPI cards, RevenueChart, TopProductsChart, stock alerts
        │   ├── Inventory.vue   ← search + tabs (real_stuff/peripherals) + CRUD table
        │   ├── Products.vue    ← product list with RecipeBuilder modal
        │   ├── Recipes.vue     ← product cards grid opening RecipeBuilder
        │   ├── Orders.vue      ← 3 tabs: Pending / To Be Delivered / Delivered; per-item delivery checkboxes update inventory
        │   ├── Invoices.vue    ← stats (total/monthly), invoice list with file link
        │   ├── Sales.vue       ← 3 tabs: overview/shifts/transactions + charts
        │   └── Staff.vue       ← staff list, role toggle (admin↔staff), invite modal
        ├── staff/
        │   ├── POS.vue         ← category filter + product grid + cart FAB
        │   ├── Checklist.vue   ← two-tab (Real Stuff/Peripherals) + OrderDraftPanel
        │   ├── MyShift.vue     ← start/end shift controls, shift revenue stats
        │   └── History.vue     ← personal revenue stats, shift breakdown, sales list
        └── receiver/
            ├── Queue.vue       ← live FIFO order queue, active shifts strip, mark complete
            ├── POS.vue         ← same as staff POS, uses receiverShiftsStore for shift context
            └── MyShift.vue     ← start/end shift for receiver account
```

---

## 6. Database Schema

### ENUMs
```sql
user_role:             'admin' | 'staff' | 'receiver'
inventory_category:    'real_stuff' | 'peripherals'
inventory_unit:        'ml' | 'g' | 'units' | 'kg' | 'L' | 'cl'
product_category:      'coffee' | 'alcohol' | 'soft_drink' | 'beer' | 'food' | 'other'
order_status:          'draft' | 'finalized' | 'delivered'
order_source:          'manual' | 'auto_threshold'
notification_status:   'unread' | 'read'
notification_severity: 'warning' | 'critical'
sale_type:             'takeaway' | 'table'
```

### Tables
```
profiles          id(PK=auth.users.id), full_name, role, avatar_url, created_at, updated_at
inventory         id, name, unit, stock_qty, warning_threshold, critical_threshold,
                  category, is_active, created_at, updated_at
products          id, name, base_price, category, is_active, created_at, updated_at
recipes           id, product_id(FK→products), inventory_id(FK→inventory),
                  quantity_required, created_at   [UNIQUE: product_id + inventory_id]
shifts            id, staff_id(FK→profiles), started_at, ended_at, notes,
                  is_active, created_at
sales             id, staff_id(FK→profiles), shift_id(FK→shifts),
                  total_amount, sale_type, table_identifier, payment_method,
                  completed_at(nullable — NULL=pending queue, NOT NULL=completed), created_at
sale_items        id, sale_id(FK→sales), product_id(FK→products),
                  qty_sold, unit_price, created_at
orders            id, created_by(FK→profiles), status, name, notes,
                  created_at, finalized_at, finalized_by(FK→profiles)
order_items       id, order_id(FK→orders), inventory_id(FK→inventory),
                  quantity_requested, source, notes, received, received_at, created_at
notifications     id, inventory_id(FK→inventory), message, status,
                  severity, created_at
invoices          id, admin_id(FK→profiles), amount, description, supplier,
                  invoice_date, file_url, created_at, updated_at
```

### Triggers
| Trigger | Table | When | What |
|---|---|---|---|
| `trg_profiles_updated_at` | profiles | BEFORE UPDATE | Sets updated_at = NOW() |
| `trg_inventory_updated_at` | inventory | BEFORE UPDATE | Sets updated_at = NOW() |
| `trg_products_updated_at` | products | BEFORE UPDATE | Sets updated_at = NOW() |
| `trg_invoices_updated_at` | invoices | BEFORE UPDATE | Sets updated_at = NOW() |
| `trg_on_auth_user_created` | auth.users | AFTER INSERT | Creates profiles row with role='staff' |
| `trg_deduct_stock_on_sale` | sale_items | AFTER INSERT | **Core logic** — see below |

### Core Trigger: `deduct_stock_on_sale()`
Fires after every `sale_items` INSERT:
1. Loops all `recipes` rows for `NEW.product_id`
2. `UPDATE inventory SET stock_qty = stock_qty - (quantity_required × qty_sold)`
3. If new stock ≤ `critical_threshold` → INSERT notification (severity=critical)
4. Else if new stock ≤ `warning_threshold` → INSERT notification (severity=warning)
5. If new stock ≤ `warning_threshold` → find or create draft order, add item with `source='auto_threshold'` (skips if already in order)

### SQL Functions (RPC)
```sql
get_daily_revenue(days_back INT)    → TABLE(sale_date, total_revenue, sale_count)
get_shift_sales(target_staff_id UUID) → TABLE(shift_id, staff_name, started_at, ended_at, total_revenue, sale_count)
get_top_products(days_back INT, limit_n INT) → TABLE(product_name, category, total_sold, total_revenue)
```

---

## 7. RLS Policies

All tables have RLS enabled. Helper functions:
- `is_admin()` — checks `profiles.role = 'admin'` for `auth.uid()`
- `is_authenticated()` — checks `auth.uid() IS NOT NULL` (SECURITY DEFINER)

> **Note:** After running `003_fix_rls_policies.sql`, INSERT policies use `auth.uid() IS NOT NULL` directly (not the helper) to avoid SECURITY DEFINER context issues.

| Table | SELECT | INSERT | UPDATE | DELETE |
|---|---|---|---|---|
| profiles | own row OR admin | (trigger only) | own row OR admin | admin |
| inventory | any authenticated | admin only | admin only | admin only |
| products | any authenticated | admin only | admin only | admin only |
| recipes | any authenticated | admin only | admin only | admin only |
| shifts | own row OR admin | own row (`staff_id = auth.uid()`) | own row OR admin | — |
| sales | own row OR admin OR receiver | own row | admin OR receiver (completed_at only) | — |
| sale_items | via own sales OR receiver | via own sales | — | — |
| orders | any authenticated | any authenticated | admin only | admin only |
| order_items | any authenticated | any authenticated | admin only | admin only |
| notifications | admin only | TRUE (trigger inserts) | admin only | — |
| invoices | admin only | admin only | admin only | admin only |

---

## 8. Edge Functions

Located in `supabase/functions/`. Run on Deno runtime.

### `process-sale/index.ts`
**Purpose:** Atomically create a sale record.
**Input:** `{ items: [{ product_id, qty_sold, unit_price }], shift_id }`
**Logic:** Validates JWT → inserts `sales` row → inserts `sale_items` rows (trigger fires per item) → returns `{ sale_id }`
**Called by:** `posStore.confirmSale()` via `callEdgeFunction('process-sale', ...)`

### `finalize-order/index.ts`
**Purpose:** Admin finalizes a draft purchase order.
**Input:** `{ order_id }`
**Logic:** Verifies admin role from JWT → `UPDATE orders SET status='finalized', finalized_at=now()` → returns `{ success: true }`
**Called by:** `ordersStore.finalizeOrder()` via `callEdgeFunction('finalize-order', ...)`

---

## 9. Pinia Stores

### `authStore`
State: `user`, `profile`, `loading`
Key actions: `initialize()` (sets up `onAuthStateChange`), `login()`, `register()`, `logout()`, `updateProfile()`, `updateStaffRole()`, `fetchAllStaff()`

### `inventoryStore`
State: `items`, `loading`
Computed: `realStuff` (category=real_stuff), `peripherals` (category=peripherals)
Key actions: `fetchAll()`, `create()`, `update()`, `delete()`, `updateStock()`, `subscribeRealtime()` (postgres_changes on inventory table)

### `productsStore`
State: `products`, `loading`
Key actions: `fetchAll()`, `create()`, `update()`, `delete()`, `addRecipe()`, `updateRecipe()`, `removeRecipe()`

### `salesStore`
State: `sales`, `loading`
Key actions: `fetchAll(limitDays)`, `fetchMine(staffId)`, `fetchByShift(shiftId)`, `fetchDailyRevenue()` (RPC), `fetchShiftSales()` (RPC), `fetchTopProducts()` (RPC)

### `ordersStore`
State: `orders`, `draftOrder`, `loading`
Computed: `draftItems`, `draftItemCount`
Key actions: `fetchAll()`, `fetchDraftOrder()`, `ensureDraftOrder()` (checks DB first, then inserts if none), `addItem(inventoryId, qty, notes)`, `removeItem()` (auto-deletes order if last item removed), `updateItemQty()`, `updateDraftName(name)`, `finalizeOrder()`, `markItemReceived(orderItemId, inventoryId, qty)` (marks received + increments inventory stock), `markOrderDelivered(orderId)`, `subscribeRealtime()`

### `notificationsStore`
State: `notifications`, `unreadCount`, `loading`
Key actions: `fetchAll()`, `markRead(id)`, `markAllRead()`, `subscribeRealtime()`

### `shiftsStore`
State: `currentShift`, `loading`
Computed: `shiftDuration` (formatted HH:MM)
Key actions: `initialize()` (restores from localStorage key `LS_KEYS.currentShiftId`), `startShift()`, `endShift()`

### `posStore`
State: `cart` (array of `{ product, quantity }`), `loading`
Computed: `cartTotal`, `cartItemCount`
Key actions: `addToCart(product)`, `removeFromCart(productId)`, `updateQty()`, `clearCart()`, `confirmSale()` (calls `process-sale` edge function)

### `invoicesStore`
State: `invoices`, `loading`
Key actions: `fetchAll()`, `create(invoiceData, file?)` (uploads file to Supabase Storage if provided), `delete()`

### `receiverStore`
State: `pendingQueue` (Sale[]), `recentCompleted` (Sale[], last 10), `loading`, `completing` (string | null — tracks which saleId is being marked)
Computed: `pendingCount`
Key actions: `fetchQueue()` (pending: completed_at IS NULL, ASC; recent: last 10 completed DESC), `markComplete(saleId)` (sets completed_at + optimistic local move from pending→completed), `subscribeRealtime()` (channel `sales-changes`: INSERT → push to pending, UPDATE → move to completed when completed_at is set)

### `receiverShiftsStore`
State: same shape as `shiftsStore`
Key difference: uses `LS_KEYS.receiverShiftId` (`coffee_inv_receiver_shift_id`) to avoid collision
Extra action: `fetchAllActive()` — returns all currently active shifts across all staff (used for the "who's on shift" strip in Queue.vue)

---

## 10. Routing & Auth Flow

### Route structure
```
/login                     → AuthLayout > Login.vue             (guest only)
/admin/dashboard           → AdminLayout > Dashboard.vue        (admin only)
/admin/inventory           → AdminLayout > Inventory.vue        (admin only)
/admin/products            → AdminLayout > Products.vue         (admin only)
/admin/recipes             → AdminLayout > Recipes.vue          (admin only)
/admin/orders              → AdminLayout > Orders.vue           (admin only)
/admin/invoices            → AdminLayout > Invoices.vue         (admin only)
/admin/sales               → AdminLayout > Sales.vue            (admin only)
/admin/staff               → AdminLayout > Staff.vue            (admin only)
/staff/pos                 → StaffLayout > POS.vue              (staff only)
/staff/checklist           → StaffLayout > Checklist.vue        (staff only)
/staff/my-shift            → StaffLayout > MyShift.vue          (staff only)
/staff/history             → StaffLayout > History.vue          (staff only)
/receiver/queue            → ReceiverLayout > Queue.vue         (receiver only)
/receiver/pos              → ReceiverLayout > POS.vue           (receiver only)
/receiver/my-shift         → ReceiverLayout > MyShift.vue       (receiver only)
```

### Navigation guard (`router/index.ts` `beforeEach`)
1. Waits for `authStore.loading` to be false (polls every 50ms)
2. Guest trying to access protected route → redirect to `/login`
3. Authenticated user trying to access `/login` → redirect to role-appropriate home
4. Staff/receiver trying to access `/admin/*` → redirect to role-appropriate home
5. Staff/admin trying to access `/receiver/*` → redirect to role-appropriate home
6. Root `/` redirects: admin → `/admin/dashboard`, receiver → `/receiver/queue`, staff → `/staff/pos`

---

## 11. Key Patterns & Conventions

### Supabase client (`src/lib/supabase.ts`)
```typescript
// Uses createClient<any> — NOT typed Database generic
// Typed generics require Supabase CLI: supabase gen types typescript --linked
export const supabase = createClient<any>(url, anonKey, { ... })

// Generic edge function caller
export async function callEdgeFunction<T>(name: string, body: object): Promise<T>
```

### Toast system (`src/composables/useToast.ts`)
```typescript
const toast = useToast()
toast.success('Title', 'optional subtitle')
toast.error('Title', 'optional subtitle')
toast.warning('Title')
toast.info('Title')
```

### Confirm dialog (`src/composables/useConfirm.ts`)
```typescript
const confirm = useConfirm()
const ok = await confirm.ask('Are you sure?', 'This cannot be undone')
if (ok) { /* proceed */ }
```

### Formatters (`src/composables/useFormatters.ts`)
```typescript
const { formatCurrency, formatDate, formatRelative } = useFormatters()
formatCurrency(12.50)    // "12,50 €" (Greek locale)
formatDate(isoString)    // "09/04/2026"
formatRelative(isoString) // "2 hours ago"
```

### Stock status utility (`src/types/index.ts`)
```typescript
getStockStatus(item: InventoryItem): 'ok' | 'warning' | 'critical' | 'out'
// out: stock_qty <= 0
// critical: stock_qty <= critical_threshold
// warning: stock_qty <= warning_threshold
// ok: above warning
```

### Realtime subscriptions
```typescript
// In useRealtime.ts — call in onMounted, unsubscribe in onUnmounted
useAdminRealtime()   // subscribes: inventory changes + new notifications
useStaffRealtime()   // subscribes: order_items inserts
```

### Shift persistence
```typescript
// shiftsStore.initialize() reads from:
localStorage.getItem(LS_KEYS.currentShiftId) // = 'coffee_app_shift_id'
// then fetches shift from DB to restore currentShift state
```

---

## 12. Known Issues & Applied Fixes

### Fix 1: `createClient<Database>` caused `never` type errors
**Problem:** All `.from().insert()` / `.update()` calls returned `never` because the typed Database generic was used without running `supabase gen types`.
**Fix:** Changed `createClient<Database>` → `createClient<any>` in `src/lib/supabase.ts`.
**Trade-off:** Loses compile-time table/column checking. Run `supabase gen types typescript --linked > src/types/database.ts` and restore the generic when you want full typing.

### Fix 2: RLS INSERT policies blocking authenticated users
**Problem:** `is_authenticated()` function is `SECURITY DEFINER`. In some Supabase configurations, `auth.uid()` loses JWT context inside a `WITH CHECK` clause when called through a SECURITY DEFINER function, silently blocking INSERTs for authenticated users.
**Symptoms:** "Failed to add to order" error when staff tap "+ Order" in Checklist.
**Fix:** `003_fix_rls_policies.sql` — replaces `is_authenticated()` with `auth.uid() IS NOT NULL` directly in all INSERT and SELECT policies for: `orders`, `order_items`, `inventory`, `products`, `recipes`.
**Status:** Migration written. Must be run in Supabase SQL Editor.

### Fix 3: TypeScript `ImportMeta.env` error
**Problem:** `import.meta.env.VITE_*` caused TS error "Property 'VITE_SUPABASE_URL' does not exist on type 'ImportMeta'".
**Fix:** Created `src/vite-env.d.ts` with `ImportMetaEnv` interface declaring all `VITE_*` variables.

### Fix 4: Chart.js tooltip callback type error
**Problem:** Chart.js tooltip `callback` functions had type errors on the `context` parameter.
**Fix:** Used `(ctx: any)` with `// eslint-disable-next-line` comments in `RevenueChart.vue`, `SalesShiftChart.vue`, `TopProductsChart.vue`.

---

## 13. Applied Fixes (as of 2026-04-09)

### Fix A: RLS INSERT policies + trigger bug + PostgREST disambiguation
All three issues below were resolved together:

**A1 — "Failed to add to order" (RLS)**
Run `003_fix_rls_policies.sql` in Supabase SQL Editor. Replaces `is_authenticated()` SECURITY DEFINER calls with `auth.uid() IS NOT NULL` in INSERT/SELECT policies for `orders`, `order_items`, `inventory`, `products`, `recipes`.

**A2 — POS sale aborting when stock hits warning threshold (trigger bug)**
Run `004_fix_bugs.sql` in Supabase SQL Editor. Rewrites `deduct_stock_on_sale()` trigger: removes the broken `INSERT INTO orders ... SELECT NEW.sale_id` (sale UUID used as profile FK → FK violation), uses correct `staff_id` from sales table. Wraps notification/auto-order section in `EXCEPTION WHEN OTHERS` so non-critical errors never abort a sale.

**A2 also adds**: `order_items_update_draft` RLS policy so staff can update quantities in draft orders.

**A3 — POS sale and order finalization (edge functions)**
Removed dependency on `process-sale` and `finalize-order` edge functions. Both operations now use direct Supabase client calls:
- `posStore.confirmSale()` → inserts into `sales` then `sale_items` directly (trigger still fires)
- `ordersStore.finalizeOrder()` → updates `orders` row directly (admin's RLS policy allows it)

**A4 — PostgREST "more than one relationship" error on orders queries**
`orders` has two FKs to `profiles` (`created_by` and `finalized_by`). All queries with `creator:profiles(...)` changed to `creator:profiles!created_by(...)` to disambiguate.

**A5 — +/- and remove buttons not reflecting in admin Orders page**
`updateItemQty()` and `removeItem()` in `ordersStore` only updated `draftOrder` state but not the `orders` list (which Orders.vue iterates). Fixed: both functions now sync changes to both `draftOrder` and `orders`.

**A6 — Realtime subscriptions never initialized**
`useAdminRealtime()` and `useStaffRealtime()` existed but were never called. Added `useAdminRealtime()` to `AdminLayout.vue`.
- **Admin realtime covers:** inventory changes, new notifications, order_items inserts
- **Staff realtime:** `useStaffRealtime()` is called directly inside each staff page that needs it (e.g. `POS.vue`). Do NOT call it from `StaffLayout.vue` — see A8.

**A7 — Admin sidebar hidden on mobile**
`AdminSidebar` had `hidden lg:flex` with no mobile toggle. Added hamburger button (`Menu` icon) in `AdminHeader` (mobile only, `lg:hidden`). Sidebar now overlays as a drawer on mobile with a backdrop. Tapping a nav item or the backdrop closes it.

**A8 — Staff POS blank on mobile / dev server (duplicate realtime channel)**
`POS.vue` already called `useStaffRealtime()` internally. We mistakenly also added it to `StaffLayout.vue`, creating two subscriptions to the same Supabase Realtime topic `realtime:inventory-changes` over the same socket. Phoenix (Supabase Realtime) rejects duplicate topic joins on a single connection; this corrupted the shared realtime socket (Supabase JS v2 multiplexes auth refresh and realtime over one socket), causing the POS page to silently fail to load data.
**Fix:** Removed `useStaffRealtime()` from `StaffLayout.vue`. It stays in `POS.vue` only.
**Rule:** Never add a realtime subscription to a layout if any child page already subscribes to the same channel. Realtime composables belong in the leaf page component that actually uses the data.

**A10 — Orders delivery tracking + order naming**
Added full delivery lifecycle: `draft` → `finalized` (placed with supplier) → `delivered` (all items received).
- Migration `005_orders_delivery.sql`: adds `delivered` to `order_status` ENUM, `name TEXT` to `orders`, `received BOOLEAN` + `received_at TIMESTAMPTZ` to `order_items`.
- Migration `006_fix_orders_rls.sql`: adds `orders_update_creator_draft` policy so staff can update their own draft order (required for saving order name).
- Admin Orders page now has 3 tabs: **Pending** (draft), **To Be Delivered** (finalized — per-item checkboxes update `inventory.stock_qty` on receipt), **Delivered** (history).
- Staff `OrderDraftPanel` has a name input at the top; saves via `ordersStore.updateDraftName()`.
- `removeItem()` auto-deletes the parent draft order when its last item is removed.
- **Rule:** Staff can only name/edit draft orders they created. Admin can update any order regardless of status.

**A9 — Dev server not accessible from mobile / other devices on local network**
Vite default config binds only to `127.0.0.1` (localhost). Accessing the dev server via the machine's LAN IP (e.g. `192.168.1.x:5173`) from a mobile device caused JS module requests to fail silently — the initial HTML loads but all `<script type="module">` fetches return connection errors, leaving the page blank.
**Fix:** Added `server: { host: true }` to `vite.config.ts`. This binds Vite to `0.0.0.0` (all interfaces), making the dev server accessible from any device on the same network.
**Note:** Requires restarting the dev server after the config change.

**A10 — Table vs Takeaway sales feature**
Added capability to assign POS sales to a specific table.
- Added `supabase/migrations/007_add_sale_type_and_table.sql` which adds `sale_type` (checked text) and `table_identifier` to the `sales` table.
- Modified POS cart UI (`SaleCart.vue`) to allow selecting Takeaway/Table and inputting table numbers.
- Added UI badging indicating Takeaway vs Table on Staff History and Admin Sales pages.

**A11 — Locked POS screen without active shift**
- The POS product grid and cart FAB in `POS.vue` are now conditionally hidden via `shiftsStore.hasActiveShift`.
- If no shift is active, an `AppEmptyState` is shown prompting the user to start a shift via the banner.

**A12 — Fixed Order Item realtime sync & Staff delete permissions**
- Rewrote the realtime subscription logic in `ordersStore.ts` to actively refresh the Admin side when any `order_items` or `orders` see `UPDATE` or `DELETE` events.
- Added `supabase/migrations/008_staff_draft_deletion.sql` granting the necessary RLS policies to let Staff delete draft order items and empty leftover draft orders.

**A13 — Payment Method Support**
- Added `payment_method` (`cash` or `card`) to the `sales` table (`009_add_payment_method.sql`).
- Added toggle switches to `SaleCart.vue` to allow staff to designate payment method on checkout.
- Display payment icons (Banknote/CreditCard) in both Staff `History.vue` and Admin `Sales.vue`.

**A14 — Receiver / Kitchen Display View**
- Added `receiver` as a third `user_role` enum value (`011_receiver_view.sql`).
- Added `completed_at TIMESTAMPTZ` to `sales` table: `NULL` = pending in queue, `NOT NULL` = completed.
- New RLS policies: receiver can SELECT all sales/sale_items, UPDATE `completed_at`, SELECT all shifts.
- New stores: `receiverStore` (order queue + realtime channel `sales-changes`), `receiverShiftsStore` (own LS key `coffee_inv_receiver_shift_id` + `fetchAllActive()` for shift display).
- New layout: `ReceiverLayout.vue` — kiosk-optimized, 3-tab bottom nav (Queue / POS / My Shift).
- New pages: `receiver/Queue.vue` (live FIFO queue with active-shifts strip), `receiver/POS.vue` (same as staff POS), `receiver/MyShift.vue`.
- `posStore.confirmSale()` accepts optional `shiftIdOverride` param for receiver context.
- `useReceiverRealtime()` composable added to `useRealtime.ts`.
- **Rule:** Receiver is a dedicated kiosk role. One receiver account per display device. Sales placed from receiver POS are attributed to the receiver's own shift and account.

**A14 — Custom System Notifications**
- Decoupled `notifications` from `inventory_id` by allowing it to be nullable, opening up generic usage (`010_general_notifications.sql`).
- Added policy allowing Staff to push items to the `notifications` table.
- Implemented an interactive "Notify Admin" button to the Staff `OrderDraftPanel.vue`.
- Updated `shiftsStore.ts` so `endShift()` automatically calculates total sales value and pushes a notification directly to the Admin.

---

## 14. Common Development Tasks

### Add a new inventory item (via UI)
Admin → Inventory → "+ Add Item" button → fill form (name, unit, category, thresholds).

### Add a new product + recipe (via UI)
Admin → Products → "+ New Product" → fill name/price/category.
Admin → Recipes → find the product → click "Edit Recipe" → add ingredients with quantities.

### Add a new admin page
1. Create `src/pages/admin/MyPage.vue` (use `<script setup>` + Composition API)
2. Add route in `src/router/index.ts` under the admin children array
3. Add `ROUTE_NAMES.ADMIN_MY_PAGE` constant in `src/lib/constants.ts`
4. Add nav item in `src/components/admin/AdminSidebar.vue`

### Add a new Pinia store action
Open the relevant store in `src/stores/`, add an `async function` inside the `defineStore` callback, add it to the `return {}` object at the bottom.

### Modify an RLS policy
Edit `supabase/migrations/003_fix_rls_policies.sql` (or create a new `004_*.sql`) with:
```sql
DROP POLICY IF EXISTS "policy_name" ON table_name;
CREATE POLICY "policy_name" ON table_name
  FOR INSERT WITH CHECK (/* your condition */);
```
Then run in Supabase SQL Editor.

### Add a new DB column
Create a new migration file `supabase/migrations/004_add_column.sql`:
```sql
ALTER TABLE inventory ADD COLUMN supplier TEXT;
-- Update corresponding TypeScript interface in src/types/index.ts
```

### Update TypeScript types for a table
Edit `src/types/index.ts`. Find the interface (e.g., `InventoryItem`) and add/modify fields. Also update the `Database` type definitions at the bottom if using them.

---

## 15. Deployment (Vercel)

1. Push repository to GitHub
2. Go to vercel.com → New Project → import the repo
3. Framework preset: **Vite** (auto-detected)
4. Add environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Deploy — Vercel auto-deploys on every push to `main`

`vercel.json` already configured with SPA rewrite:
```json
{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }
```

---

## 16. Design System

**Color palette:**
- Background: `slate-900` / `slate-800` / `slate-700`
- Brand / highlight: `amber-500` (coffee amber)
- Success / OK: `emerald-500`
- Warning: `amber-400`
- Critical / Danger: `red-500`
- Text primary: `white`
- Text secondary: `slate-400`

**Layout:**
- Admin: fixed sidebar (desktop) + top header + scrollable content
- Staff: fixed bottom nav (mobile) + top header + scrollable content

**Custom Tailwind animations** (defined in `tailwind.config.js`):
- `slide-in-right` — drawers sliding in from right
- `slide-in-up` — drawers sliding in from bottom
- `fade-in` — modals fading in

**Component sizing conventions:**
- `AppButton` sizes: `xs` / `sm` / `md` / `lg`
- `AppButton` variants: `primary` / `secondary` / `outline` / `ghost` / `danger`
- `AppBadge` variants: `gray` / `green` / `amber` / `red` / `blue` / `purple` / `orange`
