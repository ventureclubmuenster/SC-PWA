-- Migration: Create orders table
-- Run this in the Supabase SQL editor

CREATE TABLE orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL DEFAULT '',
  tickets TEXT[] NOT NULL DEFAULT '{}',
  all_data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
