-- Migration: Merge claim token fields into tickets table
-- Run this in the Supabase SQL editor
-- (Replaces the separate ticket_claim_tokens table)

-- Drop the old claim tokens table if it exists
DROP TABLE IF EXISTS ticket_claim_tokens;

-- Add claim token fields directly to tickets
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS token_hash TEXT UNIQUE;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS token_expires_at TIMESTAMPTZ;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS claimed_by UUID;

