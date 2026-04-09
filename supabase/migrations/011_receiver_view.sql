-- Migration 011: Receiver Role + Order Queue
-- Run in Supabase SQL Editor
--
-- IMPORTANT: Run the ALTER TYPE statement below FIRST (alone, before the rest),
-- because PostgreSQL does not allow ADD VALUE inside a transaction block.
-- After that, run the rest of this file.

-- ============================================================
-- 1. Extend user_role enum (run this statement alone first)
-- ============================================================
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'receiver';

-- ============================================================
-- 2. Add completed_at to sales for order queue tracking
--    NULL  = pending (in the receiver queue)
--    NOT NULL = completed (done, shown in recent section)
-- ============================================================
ALTER TABLE sales
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ DEFAULT NULL;

-- Partial index speeds up the pending queue query (completed_at IS NULL)
CREATE INDEX IF NOT EXISTS idx_sales_completed_at
  ON sales(created_at ASC)
  WHERE completed_at IS NULL;

-- ============================================================
-- 3. Helper function: check if current user is receiver
-- ============================================================
CREATE OR REPLACE FUNCTION is_receiver()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'receiver'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================
-- 4. RLS policies for sales table
-- ============================================================

-- Receiver can SELECT all sales (to show the full queue)
DROP POLICY IF EXISTS "sales_select_receiver" ON sales;
CREATE POLICY "sales_select_receiver" ON sales
  FOR SELECT USING (is_receiver());

-- Receiver can UPDATE completed_at on any sale (mark order complete)
DROP POLICY IF EXISTS "sales_update_completed_at_receiver" ON sales;
CREATE POLICY "sales_update_completed_at_receiver" ON sales
  FOR UPDATE USING (is_receiver()) WITH CHECK (is_receiver());

-- Admin can UPDATE sales (e.g. also mark complete from admin view)
DROP POLICY IF EXISTS "sales_update_admin" ON sales;
CREATE POLICY "sales_update_admin" ON sales
  FOR UPDATE USING (is_admin());

-- ============================================================
-- 5. RLS for sale_items — receiver needs to read items
--    belonging to any sale (for queue display with product details)
-- ============================================================
DROP POLICY IF EXISTS "sale_items_select_receiver" ON sale_items;
CREATE POLICY "sale_items_select_receiver" ON sale_items
  FOR SELECT USING (is_receiver());

-- ============================================================
-- 6. RLS for shifts — receiver needs to read ALL active shifts
--    to display who is currently working in the queue header
-- ============================================================
DROP POLICY IF EXISTS "shifts_select_receiver" ON shifts;
CREATE POLICY "shifts_select_receiver" ON shifts
  FOR SELECT USING (is_receiver());

-- ============================================================
-- 7. RLS for profiles — receiver needs to read profiles
--    (already covered by admin/staff policies but be explicit)
-- ============================================================
DROP POLICY IF EXISTS "profiles_select_receiver" ON profiles;
CREATE POLICY "profiles_select_receiver" ON profiles
  FOR SELECT USING (is_receiver());

-- ============================================================
-- 8. RLS for products and inventory — receiver POS needs these
-- ============================================================
DROP POLICY IF EXISTS "products_select_receiver" ON products;
CREATE POLICY "products_select_receiver" ON products
  FOR SELECT USING (is_receiver());

DROP POLICY IF EXISTS "inventory_select_receiver" ON inventory;
CREATE POLICY "inventory_select_receiver" ON inventory
  FOR SELECT USING (is_receiver());

-- ============================================================
-- NOTE: No new INSERT policy needed for sales.
-- The existing staff INSERT policy already allows any
-- authenticated user to insert with staff_id = auth.uid().
-- Receiver can therefore place sales from their own account.
-- ============================================================
