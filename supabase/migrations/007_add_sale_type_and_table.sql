-- Add sale_type and table_identifier to sales table
ALTER TABLE sales ADD COLUMN IF NOT EXISTS sale_type TEXT DEFAULT 'takeaway' CHECK (sale_type IN ('takeaway', 'table'));
ALTER TABLE sales ADD COLUMN IF NOT EXISTS table_identifier TEXT;
