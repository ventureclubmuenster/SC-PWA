import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

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
/*  POST /api/webhooks/orders                                          */
/* ------------------------------------------------------------------ */

export async function POST(request: NextRequest) {
  const secret = process.env.ORDER_WEBHOOK_HMAC_SECRET;
  if (!secret) {
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
  }

  const rawBody = await request.text();

  const signature =
    request.headers.get('x-vivenu-signature') ||
    request.headers.get('x-signature') ||
    request.headers.get('x-hub-signature-256') ||
    request.headers.get('x-webhook-signature') ||
    request.headers.get('x-hmac-signature') ||
    '';

  const providedSig = signature.replace(/^sha256=/, '').toLowerCase();
  const expectedSig = await computeHmac(secret, rawBody);
  const verified = providedSig.length > 0 && timingSafeEqual(providedSig, expectedSig);

  let body: unknown;
  try {
    body = JSON.parse(rawBody);
  } catch {
    body = rawBody;
  }

  if (!verified) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  // Persist order to Supabase
  try {
    const payload = body as {
      data?: {
        transaction?: { email?: string };
        tickets?: { _id?: string }[];
      };
    };

    const email = payload?.data?.transaction?.email ?? '';
    const ticketIds = (payload?.data?.tickets ?? [])
      .map((t) => t._id)
      .filter(Boolean) as string[];

    const supabase = createAdminClient();
    const { error: dbError } = await supabase.from('orders').insert({
      email,
      tickets: ticketIds,
      all_data: body,
    });

    if (dbError) {
      console.error('Failed to insert order:', dbError);
      return NextResponse.json({ error: 'Database insert failed' }, { status: 500 });
    }
  } catch (err) {
    console.error('Unexpected error inserting order:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
