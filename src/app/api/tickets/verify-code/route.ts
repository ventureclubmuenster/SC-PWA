import { NextRequest, NextResponse } from 'next/server';
import { decryptToken } from '@/lib/ticket-encryption';
import { hashToken, activateTicket, type PersonalizeProfileData } from '@/lib/ticket-claims';
import { verifyCode } from '@/lib/verification-codes';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/tickets/verify-code
 * Verify a 4-digit code, activate the ticket, and create a Supabase session.
 *
 * Body: { encryptedToken, email, code, profile: { firstName, lastName, attendeeRole, afterpartyRsvp, cvUrl, privacyConsent, termsConsent } }
 * Returns: { ok: true, ticketId, authToken } on success (authToken for client-side session establishment)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { encryptedToken, email, code, profile } = body;

    if (!encryptedToken || !email || !code || !profile) {
      return NextResponse.json({ error: 'Pflichtfelder fehlen.' }, { status: 400 });
    }

    if (!profile.privacyConsent || !profile.termsConsent) {
      return NextResponse.json({ error: 'Bitte stimme der Datenschutzerklärung und den AGB zu.' }, { status: 400 });
    }

    // Verify the 4-digit code
    const verification = await verifyCode(email, code, 'personalize');
    if (!verification.valid) {
      return NextResponse.json({ error: 'Ungültiger oder abgelaufener Code.' }, { status: 400 });
    }

    // Decrypt token and get ticket
    let rawToken: string;
    try {
      rawToken = await decryptToken(encryptedToken);
    } catch {
      return NextResponse.json({ error: 'Ungültiger Token.' }, { status: 400 });
    }
    const tokenHash = await hashToken(rawToken);

    // Create or find user in Supabase Auth
    const adminSupabase = createAdminClient();
    let userId: string;

    // Try to find existing user
    const { data: existingUsers } = await adminSupabase.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(
      (u) => u.email?.toLowerCase() === email.toLowerCase(),
    );

    if (existingUser) {
      userId = existingUser.id;
    } else {
      // Create new user
      const { data: newUser, error: createError } = await adminSupabase.auth.admin.createUser({
        email: email.toLowerCase(),
        email_confirm: true,
      });
      if (createError || !newUser.user) {
        console.error('Failed to create user:', createError);
        return NextResponse.json({ error: 'Benutzer konnte nicht erstellt werden.' }, { status: 500 });
      }
      userId = newUser.user.id;
    }

    // Activate the ticket
    const profileData: PersonalizeProfileData = {
      firstName: profile.firstName,
      lastName: profile.lastName,
      email: email.toLowerCase(),
      attendeeRole: profile.attendeeRole,
      afterpartyRsvp: profile.afterpartyRsvp ?? false,
      cvUrl: profile.cvUrl,
      privacyConsent: profile.privacyConsent,
      termsConsent: profile.termsConsent,
    };

    const result = await activateTicket(tokenHash, userId, profileData);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 409 });
    }

    // Generate a magic link token for session establishment
    const { data: linkData, error: linkError } = await adminSupabase.auth.admin.generateLink({
      type: 'magiclink',
      email: email.toLowerCase(),
    });

    if (linkError || !linkData) {
      console.error('Failed to generate auth link:', linkError);
      return NextResponse.json({ error: 'Sitzung konnte nicht erstellt werden.' }, { status: 500 });
    }

    // Verify the OTP server-side to set session cookies
    const serverSupabase = await createClient();
    const { error: verifyError } = await serverSupabase.auth.verifyOtp({
      token_hash: linkData.properties.hashed_token,
      type: 'magiclink',
    });

    if (verifyError) {
      console.error('Failed to establish session:', verifyError);
      // Ticket is activated but session failed — user can log in via login page
      return NextResponse.json({
        ok: true,
        ticketId: result.ticketId,
        sessionError: 'Ticket aktiviert, aber automatische Anmeldung fehlgeschlagen. Bitte melde dich über die Startseite an.',
      });
    }

    return NextResponse.json({
      ok: true,
      ticketId: result.ticketId,
    });
  } catch (err) {
    console.error('Verify-code error:', err);
    return NextResponse.json({ error: 'Interner Fehler.' }, { status: 500 });
  }
}
