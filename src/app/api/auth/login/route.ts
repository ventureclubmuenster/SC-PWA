import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createVerificationCode, sendVerificationCodeEmail } from '@/lib/verification-codes';

/**
 * POST /api/auth/login
 * Send a 4-digit login code to an email address.
 * Only works if the email has a registered (activated) ticket.
 *
 * Body: { email }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: 'E-Mail-Adresse fehlt.' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const supabase = createAdminClient();

    // Check if email has an activated ticket
    const { data: ticket } = await supabase
      .from('tickets')
      .select('id')
      .eq('activated_by_email', normalizedEmail)
      .eq('activated', true)
      .limit(1)
      .single();

    if (!ticket) {
      return NextResponse.json(
        { error: 'Unter dieser E-Mail-Adresse ist kein Ticket registriert.' },
        { status: 404 },
      );
    }

    // Generate and send verification code
    const code = await createVerificationCode(normalizedEmail, 'login');
    await sendVerificationCodeEmail(normalizedEmail, code);

    return NextResponse.json({
      ok: true,
      message: 'Bestätigungscode wurde gesendet.',
    });
  } catch (err) {
    console.error('Auth login error:', err);
    return NextResponse.json({ error: 'Interner Fehler.' }, { status: 500 });
  }
}
