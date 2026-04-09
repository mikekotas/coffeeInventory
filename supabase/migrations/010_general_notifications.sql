-- Migration 010: General Purpose Notifications
-- Run in Supabase SQL Editor

-- 1. Relax the NOT NULL constraint on inventory_id so we can send generic system logs
ALTER TABLE notifications
ALTER COLUMN inventory_id DROP NOT NULL;

-- 2. Allow staff to insert notifications directly (for draft orders or shift ending alerts)
CREATE POLICY "notifications_insert_staff" ON notifications
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
