-- Migration: Ticket Flow V2
-- Adds verification codes, ticket transfer support, and profile consent fields

-- ─── Verification Codes ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS verification_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  code_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  type TEXT NOT NULL DEFAULT 'personalize', -- 'personalize' | 'login' | 'transfer'
  ticket_token_hash TEXT, -- references tickets.token_hash for personalize/transfer flows
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_verification_codes_email ON verification_codes (email, used, expires_at);

-- ─── Ticket Transfer Fields ──────────────────────────────────────────
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS transfer_status TEXT DEFAULT NULL;
-- NULL = no transfer, 'pending' = awaiting activation, 'completed' = transferred, 'revoked' = cancelled
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS transfer_to_email TEXT DEFAULT NULL;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS transfer_token_hash TEXT DEFAULT NULL;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS transfer_token_expires_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS transferred_from_ticket_id UUID DEFAULT NULL;

-- ─── Ticket Activation Fields ────────────────────────────────────────
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS activated BOOLEAN DEFAULT FALSE;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS activated_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS activated_by_email TEXT DEFAULT NULL;

-- ─── Profile Consent Fields ─────────────────────────────────────────
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS privacy_consent BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS terms_consent BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS privacy_consent_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS terms_consent_at TIMESTAMPTZ DEFAULT NULL;

-- ─── RLS for verification_codes ──────────────────────────────────────
ALTER TABLE verification_codes ENABLE ROW LEVEL SECURITY;

-- Only service role can access verification codes (no public access)
-- The API routes use the admin client (service role) to manage codes
