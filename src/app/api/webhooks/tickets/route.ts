import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

/* ------------------------------------------------------------------ */
/*  In-memory store for recent webhook events (last 100)              */
/*  Survives across requests in the same server process               */
/* ------------------------------------------------------------------ */

export interface WebhookEvent {
  id: string;
  receivedAt: string;
  headers: Record<string, string>;
  body: unknown;
  verified: boolean;
}

// Module-level store — shared across imports in the same process
const webhookEvents: WebhookEvent[] = [];
const MAX_EVENTS = 100;

/** Retrieve recent webhook events (newest first) */
export function getRecentWebhookEvents(): WebhookEvent[] {
  return webhookEvents;
}

/* ------------------------------------------------------------------ */
/*  HMAC verification                                                  */
/* ------------------------------------------------------------------ */

async function computeHmac(secret: string, payload: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

/* ------------------------------------------------------------------ */
/*  POST /api/webhooks/tickets                                         */
/* ------------------------------------------------------------------ */

export async function POST(request: NextRequest) {
  const secret = process.env.TICKET_WEBHOOK_HMAC_SECRET;
  if (!secret) {
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
  }

  const rawBody = await request.text();

  // Look for HMAC signature — vivenu uses x-vivenu-signature
  const signature =
    request.headers.get('x-vivenu-signature') ||
    request.headers.get('x-signature') ||
    request.headers.get('x-hub-signature-256') ||
    request.headers.get('x-webhook-signature') ||
    request.headers.get('x-hmac-signature') ||
    '';

  // Strip optional "sha256=" prefix
  const providedSig = signature.replace(/^sha256=/, '').toLowerCase();
  const expectedSig = await computeHmac(secret, rawBody);
  const verified = providedSig.length > 0 && timingSafeEqual(providedSig, expectedSig);

  // Parse body
  let body: unknown;
  try {
    body = JSON.parse(rawBody);
  } catch {
    body = rawBody;
  }

  // Capture relevant headers for storage
  const headers: Record<string, string> = {};
  for (const key of ['content-type', 'x-vivenu-signature', 'x-signature', 'x-hub-signature-256', 'x-webhook-signature', 'x-hmac-signature', 'user-agent', 'x-request-id']) {
    const val = request.headers.get(key);
    if (val) headers[key] = val;
  }

  const event: WebhookEvent = {
    id: crypto.randomUUID(),
    receivedAt: new Date().toISOString(),
    headers,
    body,
    verified,
  };

  // Store (newest first, capped)
  webhookEvents.unshift(event);
  if (webhookEvents.length > MAX_EVENTS) webhookEvents.length = MAX_EVENTS;

  if (!verified) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  // Persist ticket to Supabase
  try {
    const payload = body as { data?: { ticket?: { _id?: string; email?: string } } };
    const ticketId = payload?.data?.ticket?._id ?? '';
    const email = payload?.data?.ticket?.email ?? '';

    const supabase = createAdminClient();
    const { error: dbError } = await supabase.from('tickets').insert({
      ticket_id: ticketId,
      email,
      all_data: body,
    });

    if (dbError) {
      console.error('Failed to insert ticket:', dbError);
      return NextResponse.json({ error: 'Database insert failed' }, { status: 500 });
    }
  } catch (err) {
    console.error('Unexpected error inserting ticket:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }

  return NextResponse.json({ ok: true, id: event.id });
}
