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
 * Stores hashed tokens directly on the tickets row.
 * Returns raw tokens (for email links).
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

    const { error } = await supabase
      .from('tickets')
      .update({
        token_hash: tokenHash,
        token_expires_at: expiresAt,
      })
      .eq('ticket_id', ticketId);

    if (error) {
      console.error(`Failed to set claim token for ticket ${ticketId}:`, error);
      continue;
    }

    results.push({ ticketId, rawToken });
  }

  return results;
}

/**
 * Validate and redeem a claim token. Returns the ticket_id on success.
 * Looks up the ticket by its hashed token, then atomically claims it.
 */
export interface ClaimProfileData {
  firstName: string;
  lastName: string;
  university: string;
  afterpartyRsvp: boolean;
  attendeeRole: 'student' | 'entrepreneur' | 'other';
}

export async function redeemClaimToken(
  rawToken: string,
  userId: string,
  profileData: ClaimProfileData,
): Promise<
  | { ok: true; ticketId: string }
  | { ok: false; error: string }
> {
  const tokenHash = await hashToken(rawToken);
  const supabase = createAdminClient();

  // Look up ticket by token hash
  const { data: ticket, error: lookupError } = await supabase
    .from('tickets')
    .select('*')
    .eq('token_hash', tokenHash)
    .single();

  if (lookupError || !ticket) {
    return { ok: false, error: 'Ungültiger oder abgelaufener Link.' };
  }

  // Check if already claimed
  if (ticket.claimed_by) {
    return { ok: false, error: 'Dieses Ticket wurde bereits beansprucht.' };
  }

  // Check expiry
  if (!ticket.token_expires_at || new Date(ticket.token_expires_at) < new Date()) {
    return { ok: false, error: 'Dieser Link ist abgelaufen.' };
  }

  // Get the authenticated user's email
  const { data: { user } } = await supabase.auth.admin.getUserById(userId);
  const userEmail = user?.email ?? '';

  // Save profile data including ticket_id
  const fullName = `${profileData.firstName} ${profileData.lastName}`.trim();
  await supabase
    .from('profiles')
    .update({
      first_name: profileData.firstName,
      last_name: profileData.lastName,
      full_name: fullName,
      university: profileData.university || null,
      afterparty_rsvp: profileData.afterpartyRsvp,
      attendee_role: profileData.attendeeRole,
      ticket_id: ticket.ticket_id,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  // Atomically claim: conditional update prevents race conditions
  const { data: updated, error: claimError } = await supabase
    .from('tickets')
    .update({
      claimed_by: userId,
      email: userEmail,
      status: 'assigned',
      token_expires_at: null,
    })
    .eq('id', ticket.id)
    .is('claimed_by', null)    // Only succeeds if still unclaimed
    .select()
    .single();

  if (claimError || !updated) {
    return { ok: false, error: 'Dieses Ticket wurde bereits beansprucht.' };
  }

  return { ok: true, ticketId: ticket.ticket_id };
}

/**
 * Check the status of a claim token without redeeming it.
 * Does not require authentication — used to show immediate feedback on the claim page.
 */
export async function checkClaimTokenStatus(
  rawToken: string,
): Promise<
  | { status: 'claimable' }
  | { status: 'already-claimed' }
  | { status: 'expired' }
  | { status: 'invalid' }
> {
  const tokenHash = await hashToken(rawToken);
  const supabase = createAdminClient();

  const { data: ticket, error } = await supabase
    .from('tickets')
    .select('claimed_by, token_expires_at')
    .eq('token_hash', tokenHash)
    .single();

  if (error || !ticket) {
    return { status: 'invalid' };
  }

  if (ticket.claimed_by) {
    return { status: 'already-claimed' };
  }

  if (!ticket.token_expires_at || new Date(ticket.token_expires_at) < new Date()) {
    return { status: 'expired' };
  }

  return { status: 'claimable' };
}
