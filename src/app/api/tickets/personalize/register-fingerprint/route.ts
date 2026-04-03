import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * POST /api/tickets/personalize/register-fingerprint
 * Stores a browser fingerprint → encrypted ticket token mapping.
 * Called when a user visits /personalize?t=... in the browser before
 * installing the PWA. The PWA can later look up the token by fingerprint.
 */
export async function POST(request: NextRequest) {
  try {
    const { fingerprint, encryptedToken } = await request.json();

    if (!fingerprint || typeof fingerprint !== 'string') {
      return NextResponse.json({ error: 'Fingerprint fehlt.' }, { status: 400 });
    }
    if (!encryptedToken || typeof encryptedToken !== 'string') {
      return NextResponse.json({ error: 'Token fehlt.' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Remove any existing entries for this fingerprint (user may click link multiple times)
    await supabase
      .from('pending_personalizations')
      .delete()
      .eq('fingerprint', fingerprint);

    const { error } = await supabase
      .from('pending_personalizations')
      .insert({
        fingerprint,
        encrypted_token: encryptedToken,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
      });

    if (error) {
      console.error('register-fingerprint insert error:', error);
      return NextResponse.json({ error: 'Speichern fehlgeschlagen.' }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('register-fingerprint error:', err);
    return NextResponse.json({ error: 'Interner Fehler.' }, { status: 500 });
  }
}
