-- Migration 009: Add Payment Method to Sales
-- Run in Supabase SQL Editor

ALTER TABLE sales
ADD COLUMN payment_method TEXT DEFAULT 'cash' CHECK (payment_method IN ('cash', 'card'));
