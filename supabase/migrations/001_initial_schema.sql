-- ============================================================
-- COFFEE INVENTORY PRO — Full Database Schema
-- Run this in your Supabase project's SQL Editor
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- ENUMS
-- ============================================================
CREATE TYPE user_role AS ENUM ('admin', 'staff');
CREATE TYPE inventory_category AS ENUM ('real_stuff', 'peripherals');
CREATE TYPE inventory_unit AS ENUM ('ml', 'g', 'units', 'kg', 'L', 'cl');
CREATE TYPE product_category AS ENUM ('coffee', 'alcohol', 'soft_drink', 'beer', 'food', 'other');
CREATE TYPE order_status AS ENUM ('draft', 'finalized');
CREATE TYPE order_source AS ENUM ('manual', 'auto_threshold');
CREATE TYPE notification_status AS ENUM ('unread', 'read');
CREATE TYPE notification_severity AS ENUM ('warning', 'critical');

-- ============================================================
-- TABLES
-- ============================================================

-- Profiles (extends auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'staff',
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Inventory items
CREATE TABLE inventory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  unit inventory_unit NOT NULL DEFAULT 'units',
  stock_qty NUMERIC(10, 2) NOT NULL DEFAULT 0,
  warning_threshold NUMERIC(10, 2) NOT NULL DEFAULT 10,
  critical_threshold NUMERIC(10, 2) NOT NULL DEFAULT 5,
  category inventory_category NOT NULL DEFAULT 'real_stuff',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Menu products
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  base_price NUMERIC(10, 2) NOT NULL DEFAULT 0,
  category product_category NOT NULL DEFAULT 'coffee',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Recipes (product → inventory many-to-many)
CREATE TABLE recipes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  inventory_id UUID NOT NULL REFERENCES inventory(id) ON DELETE CASCADE,
  quantity_required NUMERIC(10, 3) NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(product_id, inventory_id)
);

-- Work shifts
CREATE TABLE shifts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Sales (header)
CREATE TABLE sales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  staff_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  shift_id UUID REFERENCES shifts(id) ON DELETE SET NULL,
  total_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Sale line items
CREATE TABLE sale_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  qty_sold NUMERIC(10, 2) NOT NULL DEFAULT 1,
  unit_price NUMERIC(10, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Draft orders
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status order_status NOT NULL DEFAULT 'draft',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finalized_at TIMESTAMPTZ,
  finalized_by UUID REFERENCES profiles(id) ON DELETE SET NULL
);

-- Order line items
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  inventory_id UUID NOT NULL REFERENCES inventory(id) ON DELETE CASCADE,
  quantity_requested NUMERIC(10, 2) NOT NULL DEFAULT 1,
  source order_source NOT NULL DEFAULT 'manual',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Stock alert notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  inventory_id UUID NOT NULL REFERENCES inventory(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  status notification_status NOT NULL DEFAULT 'unread',
  severity notification_severity NOT NULL DEFAULT 'warning',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Invoices / financial records
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
  description TEXT NOT NULL,
  supplier TEXT,
  invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
  file_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_inventory_category ON inventory(category) WHERE is_active = TRUE;
CREATE INDEX idx_products_category ON products(category) WHERE is_active = TRUE;
CREATE INDEX idx_recipes_product ON recipes(product_id);
CREATE INDEX idx_recipes_inventory ON recipes(inventory_id);
CREATE INDEX idx_sales_staff ON sales(staff_id);
CREATE INDEX idx_sales_shift ON sales(shift_id);
CREATE INDEX idx_sales_created ON sales(created_at DESC);
CREATE INDEX idx_sale_items_sale ON sale_items(sale_id);
CREATE INDEX idx_sale_items_product ON sale_items(product_id);
CREATE INDEX idx_shifts_staff ON shifts(staff_id);
CREATE INDEX idx_shifts_active ON shifts(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_inventory ON order_items(inventory_id);
CREATE INDEX idx_notifications_status ON notifications(status) WHERE status = 'unread';
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);
CREATE INDEX idx_invoices_date ON invoices(invoice_date DESC);

-- ============================================================
-- TRIGGERS: auto-update updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_inventory_updated_at
  BEFORE UPDATE ON inventory
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_invoices_updated_at
  BEFORE UPDATE ON invoices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- TRIGGER: auto-create profile on user signup
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'staff')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- TRIGGER: deduct_stock_on_sale (CORE BUSINESS LOGIC)
-- Fires after each sale_item insert.
-- 1. Loops all recipe rows for the sold product
-- 2. Deducts quantity_required * qty_sold from inventory
-- 3. Creates notifications if stock falls below thresholds
-- 4. Auto-adds to active draft order if below warning threshold
-- ============================================================
CREATE OR REPLACE FUNCTION deduct_stock_on_sale()
RETURNS TRIGGER AS $$
DECLARE
  r RECORD;
  new_stock NUMERIC;
  draft_order_id UUID;
  existing_order_item UUID;
BEGIN
  -- Loop through each ingredient in the recipe for this product
  FOR r IN
    SELECT rec.inventory_id, rec.quantity_required, inv.name, inv.unit,
           inv.warning_threshold, inv.critical_threshold
    FROM recipes rec
    JOIN inventory inv ON inv.id = rec.inventory_id
    WHERE rec.product_id = NEW.product_id
  LOOP
    -- Deduct stock
    UPDATE inventory
    SET stock_qty = stock_qty - (r.quantity_required * NEW.qty_sold)
    WHERE id = r.inventory_id
    RETURNING stock_qty INTO new_stock;

    -- Create notification if below thresholds
    IF new_stock <= r.critical_threshold THEN
      INSERT INTO notifications (inventory_id, message, severity, status)
      VALUES (
        r.inventory_id,
        r.name || ' is CRITICALLY LOW: ' || ROUND(new_stock, 1) || ' ' || r.unit ||
        ' remaining (critical threshold: ' || r.critical_threshold || ' ' || r.unit || ')',
        'critical',
        'unread'
      );
    ELSIF new_stock <= r.warning_threshold THEN
      INSERT INTO notifications (inventory_id, message, severity, status)
      VALUES (
        r.inventory_id,
        r.name || ' is running low: ' || ROUND(new_stock, 1) || ' ' || r.unit ||
        ' remaining (warning threshold: ' || r.warning_threshold || ' ' || r.unit || ')',
        'warning',
        'unread'
      );
    END IF;

    -- Auto-add to draft order if below warning threshold
    IF new_stock <= r.warning_threshold THEN
      -- Find existing draft order (most recent)
      SELECT id INTO draft_order_id
      FROM orders
      WHERE status = 'draft'
      ORDER BY created_at DESC
      LIMIT 1;

      -- Create draft order if none exists
      IF draft_order_id IS NULL THEN
        INSERT INTO orders (created_by, status)
        SELECT NEW.sale_id, 'draft'
        FROM sales
        WHERE id = NEW.sale_id
        RETURNING id INTO draft_order_id;

        -- Fix: get staff_id from sales
        INSERT INTO orders (created_by, status)
        SELECT staff_id, 'draft'
        FROM sales
        WHERE id = NEW.sale_id
        ON CONFLICT DO NOTHING
        RETURNING id INTO draft_order_id;
      END IF;

      -- Check if this item is already in the draft order
      SELECT id INTO existing_order_item
      FROM order_items
      WHERE order_id = draft_order_id AND inventory_id = r.inventory_id;

      -- Only add if not already there
      IF existing_order_item IS NULL AND draft_order_id IS NOT NULL THEN
        INSERT INTO order_items (order_id, inventory_id, quantity_requested, source, notes)
        VALUES (
          draft_order_id,
          r.inventory_id,
          r.warning_threshold * 3,  -- suggest ordering 3x the warning threshold
          'auto_threshold',
          'Auto-added: stock dropped to ' || ROUND(new_stock, 1) || ' ' || r.unit
        );
      END IF;
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_deduct_stock_on_sale
  AFTER INSERT ON sale_items
  FOR EACH ROW EXECUTE FUNCTION deduct_stock_on_sale();

-- ============================================================
-- FUNCTION: get_daily_revenue (for charts)
-- ============================================================
CREATE OR REPLACE FUNCTION get_daily_revenue(days_back INTEGER DEFAULT 30)
RETURNS TABLE(sale_date DATE, total_revenue NUMERIC, sale_count BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT
    DATE(created_at) AS sale_date,
    SUM(total_amount) AS total_revenue,
    COUNT(*) AS sale_count
  FROM sales
  WHERE created_at >= NOW() - (days_back || ' days')::INTERVAL
  GROUP BY DATE(created_at)
  ORDER BY sale_date ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- FUNCTION: get_shift_sales (for shift analytics)
-- ============================================================
CREATE OR REPLACE FUNCTION get_shift_sales(target_staff_id UUID DEFAULT NULL)
RETURNS TABLE(
  shift_id UUID,
  staff_name TEXT,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  total_revenue NUMERIC,
  sale_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.id AS shift_id,
    p.full_name AS staff_name,
    s.started_at,
    s.ended_at,
    COALESCE(SUM(sa.total_amount), 0) AS total_revenue,
    COUNT(sa.id) AS sale_count
  FROM shifts s
  JOIN profiles p ON p.id = s.staff_id
  LEFT JOIN sales sa ON sa.shift_id = s.id
  WHERE (target_staff_id IS NULL OR s.staff_id = target_staff_id)
  GROUP BY s.id, p.full_name, s.started_at, s.ended_at
  ORDER BY s.started_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- FUNCTION: get_top_products (for charts)
-- ============================================================
CREATE OR REPLACE FUNCTION get_top_products(days_back INTEGER DEFAULT 30, limit_n INTEGER DEFAULT 10)
RETURNS TABLE(product_name TEXT, category product_category, total_sold NUMERIC, total_revenue NUMERIC) AS $$
BEGIN
  RETURN QUERY
  SELECT
    pr.name AS product_name,
    pr.category,
    SUM(si.qty_sold) AS total_sold,
    SUM(si.qty_sold * si.unit_price) AS total_revenue
  FROM sale_items si
  JOIN products pr ON pr.id = si.product_id
  JOIN sales sa ON sa.id = si.sale_id
  WHERE sa.created_at >= NOW() - (days_back || ' days')::INTERVAL
  GROUP BY pr.id, pr.name, pr.category
  ORDER BY total_revenue DESC
  LIMIT limit_n;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Helper function: check if current user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper function: check if current user is authenticated
CREATE OR REPLACE FUNCTION is_authenticated()
RETURNS BOOLEAN AS $$
  SELECT auth.uid() IS NOT NULL;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ---- PROFILES ----
CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT USING (id = auth.uid() OR is_admin());

CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE USING (id = auth.uid() OR is_admin());

CREATE POLICY "profiles_admin_all" ON profiles
  FOR ALL USING (is_admin());

-- ---- INVENTORY ----
CREATE POLICY "inventory_select_authenticated" ON inventory
  FOR SELECT USING (is_authenticated());

CREATE POLICY "inventory_write_admin" ON inventory
  FOR ALL USING (is_admin());

-- ---- PRODUCTS ----
CREATE POLICY "products_select_authenticated" ON products
  FOR SELECT USING (is_authenticated());

CREATE POLICY "products_write_admin" ON products
  FOR ALL USING (is_admin());

-- ---- RECIPES ----
CREATE POLICY "recipes_select_authenticated" ON recipes
  FOR SELECT USING (is_authenticated());

CREATE POLICY "recipes_write_admin" ON recipes
  FOR ALL USING (is_admin());

-- ---- SHIFTS ----
CREATE POLICY "shifts_select_own_or_admin" ON shifts
  FOR SELECT USING (staff_id = auth.uid() OR is_admin());

CREATE POLICY "shifts_insert_own" ON shifts
  FOR INSERT WITH CHECK (staff_id = auth.uid());

CREATE POLICY "shifts_update_own_or_admin" ON shifts
  FOR UPDATE USING (staff_id = auth.uid() OR is_admin());

-- ---- SALES ----
CREATE POLICY "sales_select_own_or_admin" ON sales
  FOR SELECT USING (staff_id = auth.uid() OR is_admin());

CREATE POLICY "sales_insert_own" ON sales
  FOR INSERT WITH CHECK (staff_id = auth.uid());

-- ---- SALE_ITEMS ----
CREATE POLICY "sale_items_select_via_sales" ON sale_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM sales s
      WHERE s.id = sale_items.sale_id
      AND (s.staff_id = auth.uid() OR is_admin())
    )
  );

CREATE POLICY "sale_items_insert_via_sales" ON sale_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM sales s
      WHERE s.id = sale_items.sale_id
      AND s.staff_id = auth.uid()
    )
  );

-- ---- ORDERS ----
CREATE POLICY "orders_select_authenticated" ON orders
  FOR SELECT USING (is_authenticated());

CREATE POLICY "orders_insert_authenticated" ON orders
  FOR INSERT WITH CHECK (is_authenticated());

CREATE POLICY "orders_update_admin" ON orders
  FOR UPDATE USING (is_admin());

CREATE POLICY "orders_delete_admin" ON orders
  FOR DELETE USING (is_admin());

-- ---- ORDER_ITEMS ----
CREATE POLICY "order_items_select_authenticated" ON order_items
  FOR SELECT USING (is_authenticated());

CREATE POLICY "order_items_insert_authenticated" ON order_items
  FOR INSERT WITH CHECK (is_authenticated());

CREATE POLICY "order_items_update_admin" ON order_items
  FOR UPDATE USING (is_admin());

CREATE POLICY "order_items_delete_admin" ON order_items
  FOR DELETE USING (is_admin());

-- ---- NOTIFICATIONS ----
CREATE POLICY "notifications_select_admin" ON notifications
  FOR SELECT USING (is_admin());

CREATE POLICY "notifications_update_admin" ON notifications
  FOR UPDATE USING (is_admin());

-- Allow trigger (SECURITY DEFINER) to insert
CREATE POLICY "notifications_insert_system" ON notifications
  FOR INSERT WITH CHECK (TRUE);

-- ---- INVOICES ----
CREATE POLICY "invoices_admin_only" ON invoices
  FOR ALL USING (is_admin());

-- ============================================================
-- REALTIME: enable for live updates
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE inventory;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
ALTER PUBLICATION supabase_realtime ADD TABLE order_items;
ALTER PUBLICATION supabase_realtime ADD TABLE sales;
ALTER PUBLICATION supabase_realtime ADD TABLE shifts;
