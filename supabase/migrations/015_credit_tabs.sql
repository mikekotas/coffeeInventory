-- ============================================================
-- Migration 015: Credit Tabs + Payment Method Extension
-- ============================================================

-- 1. Create credit_tabs table
CREATE TABLE credit_tabs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
  label TEXT NOT NULL,
  sale_type TEXT NOT NULL CHECK (sale_type IN ('takeaway', 'table')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'paid')),
  opened_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  paid_at TIMESTAMPTZ,
  paid_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Add credit_tab_id FK to sales
ALTER TABLE sales
  ADD COLUMN credit_tab_id UUID REFERENCES credit_tabs(id) ON DELETE SET NULL;

-- 3. Extend payment_method CHECK constraint to allow 'credit'
-- The constraint was added in migration 009 as an inline CHECK.
-- PostgreSQL auto-names it as sales_payment_method_check.
ALTER TABLE sales DROP CONSTRAINT IF EXISTS sales_payment_method_check;
ALTER TABLE sales
  ADD CONSTRAINT sales_payment_method_check
  CHECK (payment_method IN ('cash', 'card', 'credit'));

-- 4. Indexes
CREATE INDEX idx_credit_tabs_status ON credit_tabs(status) WHERE status = 'open';
CREATE INDEX idx_credit_tabs_label ON credit_tabs(label);
CREATE INDEX idx_sales_credit_tab ON sales(credit_tab_id) WHERE credit_tab_id IS NOT NULL;

-- 5. RLS for credit_tabs
ALTER TABLE credit_tabs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read credit_tabs"
  ON credit_tabs FOR SELECT
  TO authenticated
  USING (TRUE);

CREATE POLICY "Authenticated can insert credit_tabs"
  ON credit_tabs FOR INSERT
  TO authenticated
  WITH CHECK (staff_id = auth.uid());

CREATE POLICY "Authenticated can update credit_tabs"
  ON credit_tabs FOR UPDATE
  TO authenticated
  USING (TRUE)
  WITH CHECK (TRUE);
