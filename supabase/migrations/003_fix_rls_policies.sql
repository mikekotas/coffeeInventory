-- ============================================================
-- FIX: Replace SECURITY DEFINER helper in INSERT WITH CHECK clauses
-- Run this in Supabase SQL Editor
-- ============================================================

-- ORDERS: replace is_authenticated() with direct auth.uid() check
DROP POLICY IF EXISTS "orders_insert_authenticated" ON orders;
CREATE POLICY "orders_insert_authenticated" ON orders
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- ORDER_ITEMS: replace is_authenticated() with direct auth.uid() check
DROP POLICY IF EXISTS "order_items_insert_authenticated" ON order_items;
CREATE POLICY "order_items_insert_authenticated" ON order_items
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- INVENTORY: fix SELECT policy too (just in case)
DROP POLICY IF EXISTS "inventory_select_authenticated" ON inventory;
CREATE POLICY "inventory_select_authenticated" ON inventory
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- PRODUCTS: fix SELECT policy
DROP POLICY IF EXISTS "products_select_authenticated" ON products;
CREATE POLICY "products_select_authenticated" ON products
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- RECIPES: fix SELECT policy
DROP POLICY IF EXISTS "recipes_select_authenticated" ON recipes;
CREATE POLICY "recipes_select_authenticated" ON recipes
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- ORDERS: fix SELECT policy
DROP POLICY IF EXISTS "orders_select_authenticated" ON orders;
CREATE POLICY "orders_select_authenticated" ON orders
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- ORDER_ITEMS: fix SELECT policy
DROP POLICY IF EXISTS "order_items_select_authenticated" ON order_items;
CREATE POLICY "order_items_select_authenticated" ON order_items
  FOR SELECT USING (auth.uid() IS NOT NULL);
