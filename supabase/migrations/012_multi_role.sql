-- ============================================================
-- Migration 012: Multi-role support
-- Replace single `role` column with `roles` array column
-- ============================================================

-- 1. Add array column alongside the old one (non-destructive)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS roles user_role[] NOT NULL DEFAULT '{staff}';

-- 2. Migrate existing single role data into the array
UPDATE profiles SET roles = ARRAY[role]::user_role[];

-- 3. Safety constraint: at least one role always required
ALTER TABLE profiles ADD CONSTRAINT profiles_roles_not_empty
  CHECK (array_length(roles, 1) >= 1);

-- 4. GIN index for efficient ANY(roles) lookups in RLS helper functions
CREATE INDEX IF NOT EXISTS idx_profiles_roles ON profiles USING GIN(roles);

-- 5. Drop the old single-role column
ALTER TABLE profiles DROP COLUMN IF EXISTS role;

-- 6. Rewrite is_admin() to check array membership
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS(
    SELECT 1 FROM profiles WHERE id = auth.uid() AND 'admin' = ANY(roles)
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 7. Rewrite is_receiver() to check array membership
CREATE OR REPLACE FUNCTION is_receiver()
RETURNS BOOLEAN AS $$
  SELECT EXISTS(
    SELECT 1 FROM profiles WHERE id = auth.uid() AND 'receiver' = ANY(roles)
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 8. Rewrite handle_new_user trigger to write to roles array
--    Reads first role from user metadata, defaults to 'staff'
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  initial_role user_role;
BEGIN
  initial_role := COALESCE(
    (NEW.raw_user_meta_data->>'role')::user_role,
    'staff'
  );
  INSERT INTO profiles (id, full_name, roles)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'),
    ARRAY[initial_role]
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
