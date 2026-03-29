-- Migration: Ticket claim tokens for secure magic link flow
-- Run this in the Supabase SQL editor

-- Claim tokens table
CREATE TABLE ticket_claim_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id TEXT NOT NULL,            -- Vivenu ticket ID (matches tickets.ticket_id)
  token_hash TEXT NOT NULL UNIQUE,    -- SHA-256 hash of the claim token
  expires_at TIMESTAMPTZ NOT NULL,
  claimed_at TIMESTAMPTZ,
  claimed_by UUID,                    -- auth.users(id) of the claimer
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Only one active (unclaimed) token per ticket
CREATE UNIQUE INDEX idx_active_claim_token_per_ticket
  ON ticket_claim_tokens(ticket_id)
  WHERE claimed_at IS NULL;

ALTER TABLE ticket_claim_tokens DISABLE ROW LEVEL SECURITY;

-- Add claimed_by column to tickets table
ALTER TABLE tickets ADD COLUMN claimed_by UUID;
