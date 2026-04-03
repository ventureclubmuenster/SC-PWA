import { NextRequest, NextResponse } from 'next/server';
import { decryptToken } from '@/lib/ticket-encryption';
import { hashToken } from '@/lib/ticket-claims';
import { checkTokenStatus } from '@/lib/ticket-claims';
import { createVerificationCode, sendVerificationCodeEmail } from '@/lib/verification-codes';

/**
 * POST /api/tickets/personalize
 * Saves personalization profile data tentatively and sends a 4-digit verification code.
 * Does NOT require authentication — the code verification step establishes the session.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { encryptedToken, email, firstName, lastName, attendeeRole } = body;

    if (!encryptedToken || !email || !firstName || !lastName || !attendeeRole) {
      return NextResponse.json({ error: 'Pflichtfelder fehlen.' }, { status: 400 });
    }

    // Decrypt the token from URL parameter
    let rawToken: string;
    try {
      rawToken = await decryptToken(encryptedToken);
    } catch {
      return NextResponse.json({ error: 'Ungültiger Token.' }, { status: 400 });
    }

    const tokenHash = await hashToken(rawToken);

    // Check ticket status
    const status = await checkTokenStatus(tokenHash);
    if (status.status === 'activated') {
      return NextResponse.json({ error: 'Dieses Ticket wurde bereits aktiviert.' }, { status: 409 });
    }
    if (status.status === 'expired') {
      return NextResponse.json({ error: 'Dieser Link ist abgelaufen.' }, { status: 410 });
    }
    if (status.status === 'invalid') {
      return NextResponse.json({ error: 'Ungültiger Token.' }, { status: 400 });
    }

    // Generate and send verification code
    const code = await createVerificationCode(
      email,
      'personalize',
      tokenHash,
    );

    await sendVerificationCodeEmail(email, code);

    return NextResponse.json({
      ok: true,
      message: 'Bestätigungscode wurde gesendet.',
    });
  } catch (err) {
    console.error('Personalize error:', err);
    return NextResponse.json({ error: 'Interner Fehler.' }, { status: 500 });
  }
}

/**
 * GET /api/tickets/personalize?t=<encryptedToken>
 * Check the status of a ticket token (for the personalize page).
 */
export async function GET(request: NextRequest) {
  const encryptedToken = request.nextUrl.searchParams.get('t');
  if (!encryptedToken) {
    return NextResponse.json({ error: 'Token fehlt.' }, { status: 400 });
  }

  try {
    const rawToken = await decryptToken(encryptedToken);
    const tokenHash = await hashToken(rawToken);
    const status = await checkTokenStatus(tokenHash);
    return NextResponse.json(status);
  } catch {
    return NextResponse.json({ status: 'invalid' });
  }
}
