import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * POST /api/tickets/personalize/lookup-fingerprint
 * Looks up a pending personalization by browser fingerprint.
 * Called by the PWA on launch (standalone mode) to find the ticket
 * the user wanted to personalize before installing the app.
 *
 * Strategy: try exact fingerprint match first. If none found, fall back
 * to the most recent pending personalization (covers cases where the
 * fingerprint differs slightly between browser and PWA contexts).
 */
export async function POST(request: NextRequest) {
  try {
    const { fingerprint } = await request.json();
    const supabase = createAdminClient();
    const now = new Date().toISOString();

    // Clean up expired entries
    await supabase
      .from('pending_personalizations')
      .delete()
      .lt('expires_at', now);

    // 1. Try exact fingerprint match
    if (fingerprint && typeof fingerprint === 'string') {
      const { data, error } = await supabase
        .from('pending_personalizations')
        .select('encrypted_token')
        .eq('fingerprint', fingerprint)
        .gt('expires_at', now)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        console.log('[lookup-fingerprint] exact match found for fp:', fingerprint);
        return NextResponse.json({
          found: true,
          encryptedToken: data.encrypted_token,
        });
      }
    }

    // 2. Fallback: return the most recently stored pending personalization
    const { data: fallback, error: fbError } = await supabase
      .from('pending_personalizations')
      .select('encrypted_token, fingerprint')
      .gt('expires_at', now)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!fbError && fallback) {
      console.log('[lookup-fingerprint] fallback: returning latest entry (stored fp:', fallback.fingerprint, ', request fp:', fingerprint, ')');
      return NextResponse.json({
        found: true,
        encryptedToken: fallback.encrypted_token,
      });
    }

    console.log('[lookup-fingerprint] no pending personalization found');
    return NextResponse.json({ found: false });
  } catch (err) {
    console.error('lookup-fingerprint error:', err);
    return NextResponse.json({ found: false });
  }
}
