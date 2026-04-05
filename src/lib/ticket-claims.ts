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

    // Upsert: if ticket row exists, update it; if not, create it with token_hash
    const { error } = await supabase
      .from('tickets')
      .upsert(
        {
          ticket_id: ticketId,
          token_hash: tokenHash,
          token_expires_at: expiresAt,
        },
        { onConflict: 'ticket_id' },
      );

    if (error) {
      console.error(`Failed to set claim token for ticket ${ticketId}:`, error);
      continue;
    }

    // Verify token was actually written
    const { data: check } = await supabase
      .from('tickets')
      .select('token_hash')
      .eq('ticket_id', ticketId)
      .single();

    if (!check?.token_hash) {
      console.error(`token_hash is still empty for ticket ${ticketId} after upsert!`);
    }

    results.push({ ticketId, rawToken });
  }

  return results;
}

/* ------------------------------------------------------------------ */
/*  Personalize Profile Data                                           */
/* ------------------------------------------------------------------ */

export interface PersonalizeProfileData {
  firstName: string;
  lastName: string;
  email: string;
  attendeeRole: 'student' | 'entrepreneur' | 'other';
  afterpartyRsvp: boolean;
  cvUrl?: string;
  privacyConsent: boolean;
  termsConsent: boolean;
}

/* ------------------------------------------------------------------ */
/*  Token Lookup (by hash)                                             */
/* ------------------------------------------------------------------ */

/**
 * Look up a ticket by its token hash. Returns the ticket row or null.
 */
export async function lookupTicketByTokenHash(tokenHash: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('tickets')
    .select('*')
    .eq('token_hash', tokenHash)
    .single();
  if (error || !data) return null;
  return data;
}

/* ------------------------------------------------------------------ */
/*  Check Token Status (for personalize/transfer pages)                */
/* ------------------------------------------------------------------ */

export type TokenStatus =
  | { status: 'claimable'; ticketLabel?: string }
  | { status: 'activated' }
  | { status: 'transfer-pending'; transferToEmail: string }
  | { status: 'expired' }
  | { status: 'invalid' };

export async function checkTokenStatus(tokenHash: string): Promise<TokenStatus> {
  const supabase = createAdminClient();

  const { data: ticket, error } = await supabase
    .from('tickets')
    .select('activated, transfer_status, transfer_to_email, token_expires_at, all_data')
    .eq('token_hash', tokenHash)
    .single();

  if (error || !ticket) {
    return { status: 'invalid' };
  }

  if (ticket.activated) {
    return { status: 'activated' };
  }

  if (ticket.transfer_status === 'pending' && ticket.transfer_to_email) {
    return { status: 'transfer-pending', transferToEmail: ticket.transfer_to_email };
  }

  if (ticket.token_expires_at && new Date(ticket.token_expires_at) < new Date()) {
    return { status: 'expired' };
  }

  const ticketLabel = (ticket.all_data as Record<string, string>)?.ticketName ?? undefined;
  return { status: 'claimable', ticketLabel };
}

/* ------------------------------------------------------------------ */
/*  Activate Ticket                                                    */
/* ------------------------------------------------------------------ */

/**
 * Activate a ticket after successful 4-digit code verification.
 * Sets the ticket as activated and links it to the user profile.
 */
export async function activateTicket(
  tokenHash: string,
  userId: string,
  profileData: PersonalizeProfileData,
): Promise<{ ok: true; ticketId: string } | { ok: false; error: string }> {
  const supabase = createAdminClient();

  const { data: ticket, error: lookupError } = await supabase
    .from('tickets')
    .select('*')
    .eq('token_hash', tokenHash)
    .single();

  if (lookupError || !ticket) {
    return { ok: false, error: 'Ungültiger oder abgelaufener Link.' };
  }

  if (ticket.activated) {
    return { ok: false, error: 'Dieses Ticket wurde bereits aktiviert.' };
  }

  if (ticket.token_expires_at && new Date(ticket.token_expires_at) < new Date()) {
    return { ok: false, error: 'Dieser Link ist abgelaufen.' };
  }

  const now = new Date().toISOString();
  const fullName = `${profileData.firstName} ${profileData.lastName}`.trim();

  // Update profile
  await supabase
    .from('profiles')
    .update({
      first_name: profileData.firstName,
      last_name: profileData.lastName,
      full_name: fullName,
      email: profileData.email.toLowerCase(),
      attendee_role: profileData.attendeeRole,
      afterparty_rsvp: profileData.afterpartyRsvp,
      cv_url: profileData.cvUrl || null,
      privacy_consent: profileData.privacyConsent,
      terms_consent: profileData.termsConsent,
      privacy_consent_at: profileData.privacyConsent ? now : null,
      terms_consent_at: profileData.termsConsent ? now : null,
      ticket_id: ticket.ticket_id,
      updated_at: now,
    })
    .eq('id', userId);

  // Atomically activate ticket
  const { data: updated, error: activateError } = await supabase
    .from('tickets')
    .update({
      claimed_by: userId,
      email: profileData.email.toLowerCase(),
      status: 'assigned',
      activated: true,
      activated_at: now,
      activated_by_email: profileData.email.toLowerCase(),
    })
    .eq('id', ticket.id)
    .eq('activated', false)
    .select()
    .single();

  if (activateError || !updated) {
    return { ok: false, error: 'Dieses Ticket wurde bereits aktiviert.' };
  }

  return { ok: true, ticketId: ticket.ticket_id };
}

/* ------------------------------------------------------------------ */
/*  Transfer                                                           */
/* ------------------------------------------------------------------ */

/**
 * Initiate a ticket transfer. Sets pending status and creates a new token for recipient.
 */
export async function initiateTransfer(
  tokenHash: string,
  recipientEmail: string,
): Promise<
  | { ok: true; transferToken: string; ticketLabel: string }
  | { ok: false; error: string }
> {
  const supabase = createAdminClient();

  const { data: ticket, error: lookupError } = await supabase
    .from('tickets')
    .select('*')
    .eq('token_hash', tokenHash)
    .single();

  if (lookupError || !ticket) {
    return { ok: false, error: 'Ungültiges Ticket.' };
  }

  if (ticket.activated) {
    return { ok: false, error: 'Dieses Ticket wurde bereits aktiviert und kann nicht weitergeleitet werden.' };
  }

  if (ticket.transfer_status === 'pending') {
    return { ok: false, error: 'Es gibt bereits einen ausstehenden Transfer. Bitte widerrufe diesen zuerst.' };
  }

  // Generate a new claim token for the recipient
  const transferRawToken = generateClaimToken();
  const transferTokenHash = await hashToken(transferRawToken);
  const expiresAt = new Date(
    Date.now() + CLAIM_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000,
  ).toISOString();

  const { error: updateError } = await supabase
    .from('tickets')
    .update({
      transfer_status: 'pending',
      transfer_to_email: recipientEmail.toLowerCase(),
      transfer_token_hash: transferTokenHash,
      transfer_token_expires_at: expiresAt,
    })
    .eq('id', ticket.id)
    .eq('activated', false);

  if (updateError) {
    return { ok: false, error: 'Transfer konnte nicht gestartet werden.' };
  }

  const ticketLabel = (ticket.all_data as Record<string, string>)?.ticketName ?? 'Ticket';
  return { ok: true, transferToken: transferRawToken, ticketLabel };
}

/**
 * Revoke a pending transfer.
 */
export async function revokeTransfer(
  tokenHash: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = createAdminClient();

  const { data: ticket, error: lookupError } = await supabase
    .from('tickets')
    .select('id, transfer_status, activated')
    .eq('token_hash', tokenHash)
    .single();

  if (lookupError || !ticket) {
    return { ok: false, error: 'Ungültiges Ticket.' };
  }

  if (ticket.activated) {
    return { ok: false, error: 'Dieses Ticket wurde bereits aktiviert.' };
  }

  if (ticket.transfer_status !== 'pending') {
    return { ok: false, error: 'Kein ausstehender Transfer vorhanden.' };
  }

  const { error: updateError } = await supabase
    .from('tickets')
    .update({
      transfer_status: 'revoked',
      transfer_to_email: null,
      transfer_token_hash: null,
      transfer_token_expires_at: null,
    })
    .eq('id', ticket.id);

  if (updateError) {
    return { ok: false, error: 'Transfer konnte nicht widerrufen werden.' };
  }

  return { ok: true };
}

/* ------------------------------------------------------------------ */
/*  Legacy: Check claim token status (kept for backwards compat)       */
/* ------------------------------------------------------------------ */

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
    .select('claimed_by, activated, token_expires_at')
    .eq('token_hash', tokenHash)
    .single();

  if (error || !ticket) {
    return { status: 'invalid' };
  }

  if (ticket.claimed_by || ticket.activated) {
    return { status: 'already-claimed' };
  }

  if (!ticket.token_expires_at || new Date(ticket.token_expires_at) < new Date()) {
    return { status: 'expired' };
  }

  return { status: 'claimable' };
}
