-- Migration 008: Allow Staff to delete from draft orders
-- Run in Supabase SQL Editor

-- 1. Allow any authenticated user to delete order items if they belong to a draft order
CREATE POLICY "order_items_delete_draft" ON order_items
  FOR DELETE
  USING (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM orders
      WHERE id = order_items.order_id AND status = 'draft'
    )
  );

-- 2. Allow the creator to delete the actual draft order
CREATE POLICY "orders_delete_creator_draft" ON orders
  FOR DELETE
  USING (auth.uid() = created_by AND status = 'draft');
