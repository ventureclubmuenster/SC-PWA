import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * POST /api/tickets/personalize/lookup-fingerprint
 * Looks up a pending personalization by browser fingerprint.
 * Called by the PWA on launch (standalone mode) to find the ticket
 * the user wanted to personalize before installing the app.
 * 
 * Uses POST (not GET) because the fingerprint is sent in the body.
 */
export async function POST(request: NextRequest) {
  try {
    const { fingerprint } = await request.json();

    if (!fingerprint || typeof fingerprint !== 'string') {
      return NextResponse.json({ found: false });
    }

    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from('pending_personalizations')
      .select('encrypted_token')
      .eq('fingerprint', fingerprint)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('lookup-fingerprint error:', error);
      return NextResponse.json({ found: false });
    }

    if (!data) {
      return NextResponse.json({ found: false });
    }

    return NextResponse.json({
      found: true,
      encryptedToken: data.encrypted_token,
    });
  } catch (err) {
    console.error('lookup-fingerprint error:', err);
    return NextResponse.json({ found: false });
  }
}
