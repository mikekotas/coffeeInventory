-- ============================================================
-- Migration 005: Orders delivery tracking + order naming
-- Run in Supabase SQL Editor
-- ============================================================

-- 1. Add 'delivered' to order_status ENUM
ALTER TYPE order_status ADD VALUE IF NOT EXISTS 'delivered';

-- 2. Add name column to orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS name TEXT;

-- 3. Add delivery tracking columns to order_items
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS received BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS received_at TIMESTAMPTZ;

-- 4. Index for faster filtering of received items
CREATE INDEX IF NOT EXISTS idx_order_items_received ON order_items(received);

-- Note: No new RLS policies needed.
-- - Admin UPDATE on orders is already covered by "orders_update_admin" policy.
-- - Admin UPDATE on order_items is already covered by "order_items_update_admin" policy.
-- - Inventory UPDATE (to increment stock on receipt) is already covered by admin-only policy.
