-- Migration: Add email column to existing tickets table
-- Run this in the Supabase SQL editor

ALTER TABLE tickets
  ADD COLUMN email TEXT NOT NULL DEFAULT '';
