// ============================================================
// ENUMS (mirroring PostgreSQL enums)
// ============================================================

export type UserRole = 'admin' | 'staff' | 'receiver'
export type InventoryCategory = 'real_stuff' | 'peripherals'
export type InventoryUnit = 'ml' | 'g' | 'units' | 'kg' | 'L' | 'cl'
export type ProductCategory = 'coffee' | 'alcohol' | 'soft_drink' | 'beer' | 'food' | 'other'
export type OrderStatus = 'draft' | 'finalized' | 'delivered'
export type OrderSource = 'manual' | 'auto_threshold'
export type NotificationStatus = 'unread' | 'read'
export type NotificationSeverity = 'warning' | 'critical'

// ============================================================
// DATABASE MODELS
// ============================================================

export interface Profile {
  id: string
  full_name: string
  roles: UserRole[]
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface InventoryItem {
  id: string
  name: string
  unit: InventoryUnit
  stock_qty: number
  warning_threshold: number
  critical_threshold: number
  category: InventoryCategory
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Product {
  id: string
  name: string
  base_price: number
  category: ProductCategory
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Recipe {
  id: string
  product_id: string
  inventory_id: string
  quantity_required: number
  created_at: string
  // Joined fields
  inventory?: InventoryItem
  product?: Product
}

export interface Shift {
  id: string
  staff_id: string
  started_at: string
  ended_at: string | null
  notes: string | null
  is_active: boolean
  created_at: string
  // Joined fields
  profile?: Profile
}

export interface Sale {
  id: string
  staff_id: string
  shift_id: string | null
  total_amount: number
  sale_type?: 'takeaway' | 'table'
  table_identifier?: string | null
  payment_method?: 'cash' | 'card'
  created_at: string
  completed_at: string | null
  // Joined fields
  profile?: Profile
  shift?: Shift
  sale_items?: SaleItem[]
}

export interface SaleItem {
  id: string
  sale_id: string
  product_id: string
  qty_sold: number
  unit_price: number
  created_at: string
  // Joined fields
  product?: Product
}

export interface Order {
  id: string
  created_by: string
  status: OrderStatus
  name: string | null
  notes: string | null
  created_at: string
  finalized_at: string | null
  finalized_by: string | null
  // Joined fields
  creator?: Profile
  order_items?: OrderItem[]
}

export interface OrderItem {
  id: string
  order_id: string
  inventory_id: string
  quantity_requested: number
  source: OrderSource
  notes: string | null
  received: boolean
  received_at: string | null
  created_at: string
  // Joined fields
  inventory?: InventoryItem
}

export interface Notification {
  id: string
  inventory_id: string | null
  message: string
  status: NotificationStatus
  severity: NotificationSeverity
  created_at: string
  // Joined fields
  inventory?: InventoryItem
}

export interface Invoice {
  id: string
  admin_id: string
  amount: number
  description: string
  supplier: string | null
  invoice_date: string
  file_url: string | null
  created_at: string
  updated_at: string
  // Joined fields
  admin?: Profile
}

// ============================================================
// FORM / INPUT TYPES
// ============================================================

export interface InventoryItemForm {
  name: string
  unit: InventoryUnit
  stock_qty: number
  warning_threshold: number
  critical_threshold: number
  category: InventoryCategory
  is_active: boolean
}

export interface ProductForm {
  name: string
  base_price: number
  category: ProductCategory
  is_active: boolean
}

export interface RecipeForm {
  inventory_id: string
  quantity_required: number
}

export interface InvoiceForm {
  amount: number
  description: string
  supplier: string
  invoice_date: string
  file_url?: string
}

// ============================================================
// POS / CART TYPES
// ============================================================

export interface CartItem {
  product: Product
  qty: number
}

// ============================================================
// ANALYTICS TYPES
// ============================================================

export interface DailyRevenue {
  sale_date: string
  total_revenue: number
  sale_count: number
}

export interface ShiftSales {
  shift_id: string
  staff_name: string
  started_at: string
  ended_at: string | null
  total_revenue: number
  sale_count: number
}

export interface TopProduct {
  product_name: string
  category: ProductCategory
  total_sold: number
  total_revenue: number
}

// ============================================================
// STOCK STATUS
// ============================================================

export type StockStatus = 'ok' | 'warning' | 'critical' | 'out'

export function getStockStatus(item: InventoryItem): StockStatus {
  if (item.stock_qty <= 0) return 'out'
  if (item.stock_qty <= item.critical_threshold) return 'critical'
  if (item.stock_qty <= item.warning_threshold) return 'warning'
  return 'ok'
}

// ============================================================
// DATABASE SCHEMA TYPE (for Supabase client typing)
// ============================================================

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Omit<Profile, 'created_at' | 'updated_at'>
        Update: Partial<Omit<Profile, 'id' | 'created_at'>>
      }
      inventory: {
        Row: InventoryItem
        Insert: Omit<InventoryItem, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<InventoryItem, 'id' | 'created_at'>>
      }
      products: {
        Row: Product
        Insert: Omit<Product, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Product, 'id' | 'created_at'>>
      }
      recipes: {
        Row: Recipe
        Insert: Omit<Recipe, 'id' | 'created_at' | 'inventory' | 'product'>
        Update: Partial<Omit<Recipe, 'id' | 'created_at'>>
      }
      shifts: {
        Row: Shift
        Insert: Omit<Shift, 'id' | 'created_at' | 'profile'>
        Update: Partial<Omit<Shift, 'id' | 'created_at'>>
      }
      sales: {
        Row: Sale
        Insert: Omit<Sale, 'id' | 'created_at' | 'profile' | 'shift' | 'sale_items'>
        Update: Partial<Omit<Sale, 'id' | 'created_at'>>
      }
      sale_items: {
        Row: SaleItem
        Insert: Omit<SaleItem, 'id' | 'created_at' | 'product'>
        Update: Partial<Omit<SaleItem, 'id' | 'created_at'>>
      }
      orders: {
        Row: Order
        Insert: Omit<Order, 'id' | 'created_at' | 'creator' | 'order_items'>
        Update: Partial<Omit<Order, 'id' | 'created_at'>>
      }
      order_items: {
        Row: OrderItem
        Insert: Omit<OrderItem, 'id' | 'created_at' | 'inventory'>
        Update: Partial<Omit<OrderItem, 'id' | 'created_at'>>
      }
      notifications: {
        Row: Notification
        Insert: Omit<Notification, 'id' | 'created_at' | 'inventory'>
        Update: Partial<Omit<Notification, 'id' | 'created_at'>>
      }
      invoices: {
        Row: Invoice
        Insert: Omit<Invoice, 'id' | 'created_at' | 'updated_at' | 'admin'>
        Update: Partial<Omit<Invoice, 'id' | 'created_at'>>
      }
    }
  }
}
