-- Add Greek name columns to products and inventory tables
-- These are optional fields; existing data is unchanged.
-- When locale is 'el', the app shows name_el if set, falling back to name.

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS name_el TEXT;

ALTER TABLE inventory
  ADD COLUMN IF NOT EXISTS name_el TEXT;
