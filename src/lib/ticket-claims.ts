import { createAdminClient } from '@/lib/supabase/admin';

/**
 * Generate a cryptographically random claim token (32 bytes, hex-encoded).
 */
export function generateClaimToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * SHA-256 hash a token for storage (never store raw tokens).
 */
export async function hashToken(token: string): Promise<string> {
  const data = new TextEncoder().encode(token);
  const buf = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

const CLAIM_TOKEN_TTL_DAYS = 7;

export interface GeneratedClaimToken {
  ticketId: string;
  rawToken: string;
}

/**
 * Create claim tokens for all tickets in an order.
 * Returns raw tokens (for email links) — only hashes are stored in DB.
 */
export async function createClaimTokensForOrder(
  ticketIds: string[],
): Promise<GeneratedClaimToken[]> {
  if (ticketIds.length === 0) return [];

  const supabase = createAdminClient();
  const results: GeneratedClaimToken[] = [];
  const expiresAt = new Date(
    Date.now() + CLAIM_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000,
  ).toISOString();

  for (const ticketId of ticketIds) {
    const rawToken = generateClaimToken();
    const tokenHash = await hashToken(rawToken);

    // Invalidate any previous unclaimed token for this ticket
    await supabase
      .from('ticket_claim_tokens')
      .update({ claimed_at: new Date().toISOString() })
      .eq('ticket_id', ticketId)
      .is('claimed_at', null);

    const { error } = await supabase.from('ticket_claim_tokens').insert({
      ticket_id: ticketId,
      token_hash: tokenHash,
      expires_at: expiresAt,
    });

    if (error) {
      console.error(`Failed to create claim token for ticket ${ticketId}:`, error);
      continue;
    }

    results.push({ ticketId, rawToken });
  }

  return results;
}

/**
 * Validate and redeem a claim token. Returns the ticket_id on success.
 * Uses constant-time hash comparison by looking up the computed hash directly.
 */
export async function redeemClaimToken(
  rawToken: string,
  userId: string,
): Promise<
  | { ok: true; ticketId: string }
  | { ok: false; error: string }
> {
  const tokenHash = await hashToken(rawToken);
  const supabase = createAdminClient();

  // Look up token by hash (unique index ensures at most one result)
  const { data: claimToken, error: lookupError } = await supabase
    .from('ticket_claim_tokens')
    .select('*')
    .eq('token_hash', tokenHash)
    .single();

  if (lookupError || !claimToken) {
    return { ok: false, error: 'Ungültiger oder abgelaufener Link.' };
  }

  // Check if already claimed
  if (claimToken.claimed_at) {
    return { ok: false, error: 'Dieses Ticket wurde bereits beansprucht.' };
  }

  // Check expiry
  if (new Date(claimToken.expires_at) < new Date()) {
    return { ok: false, error: 'Dieser Link ist abgelaufen.' };
  }

  // Atomically claim the token (conditional update prevents race conditions)
  const { data: updated, error: claimError } = await supabase
    .from('ticket_claim_tokens')
    .update({
      claimed_at: new Date().toISOString(),
      claimed_by: userId,
    })
    .eq('id', claimToken.id)
    .is('claimed_at', null) // Ensures no race condition
    .select()
    .single();

  if (claimError || !updated) {
    return { ok: false, error: 'Dieses Ticket wurde bereits beansprucht.' };
  }

  // Get the authenticated user's email
  const { data: { user } } = await supabase.auth.admin.getUserById(userId);
  const userEmail = user?.email ?? '';

  // Update the ticket record — assign to user
  const { error: ticketError } = await supabase
    .from('tickets')
    .update({
      claimed_by: userId,
      email: userEmail,
      status: 'assigned',
    })
    .eq('ticket_id', claimToken.ticket_id);

  if (ticketError) {
    console.error('Failed to update ticket after claim:', ticketError);
    // Token is already consumed — ticket update failure is non-critical
    // The claim is still valid; admin can reconcile
  }

  return { ok: true, ticketId: claimToken.ticket_id };
}
