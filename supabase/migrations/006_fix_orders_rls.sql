-- Migration 006: Allow order creator to update their own draft order
-- (fixes staff not being able to save order name)
-- Run in Supabase SQL Editor

CREATE POLICY "orders_update_creator_draft" ON orders
  FOR UPDATE
  USING (auth.uid() = created_by AND status = 'draft')
  WITH CHECK (auth.uid() = created_by AND status = 'draft');
