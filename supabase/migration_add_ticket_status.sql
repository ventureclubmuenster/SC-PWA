-- Migration: Add status column to existing tickets table
-- Run this in the Supabase SQL editor

ALTER TABLE tickets
  ADD COLUMN status TEXT NOT NULL DEFAULT 'created'
  CHECK (status IN ('created', 'assigned', 'validated'));
