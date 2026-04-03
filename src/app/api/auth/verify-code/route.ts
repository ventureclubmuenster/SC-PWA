import { NextRequest, NextResponse } from 'next/server';
import { verifyCode } from '@/lib/verification-codes';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/auth/verify-code
 * Verify a login 4-digit code and establish a Supabase session.
 *
 * Body: { email, code }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, code } = body;

    if (!email || !code) {
      return NextResponse.json({ error: 'Pflichtfelder fehlen.' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Verify the 4-digit code
    const verification = await verifyCode(normalizedEmail, code, 'login');
    if (!verification.valid) {
      return NextResponse.json({ error: 'Ungültiger oder abgelaufener Code.' }, { status: 400 });
    }

    // Generate a magic link token and establish session
    const adminSupabase = createAdminClient();

    const { data: linkData, error: linkError } = await adminSupabase.auth.admin.generateLink({
      type: 'magiclink',
      email: normalizedEmail,
    });

    if (linkError || !linkData) {
      console.error('Failed to generate auth link:', linkError);
      return NextResponse.json({ error: 'Anmeldung fehlgeschlagen.' }, { status: 500 });
    }

    // Verify the OTP server-side to set session cookies
    const serverSupabase = await createClient();
    const { error: verifyError } = await serverSupabase.auth.verifyOtp({
      token_hash: linkData.properties.hashed_token,
      type: 'magiclink',
    });

    if (verifyError) {
      console.error('Failed to establish session:', verifyError);
      return NextResponse.json({ error: 'Sitzung konnte nicht erstellt werden.' }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Auth verify-code error:', err);
    return NextResponse.json({ error: 'Interner Fehler.' }, { status: 500 });
  }
}
