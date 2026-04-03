import { NextRequest, NextResponse } from 'next/server';
import { decryptToken, encryptToken } from '@/lib/ticket-encryption';
import { hashToken, initiateTransfer, checkTokenStatus } from '@/lib/ticket-claims';
import { sendEmail, buildTransferReceiptHtml } from '@/lib/email';

/**
 * POST /api/tickets/transfer
 * Initiate a ticket transfer to another email address.
 *
 * Body: { encryptedToken, recipientEmail }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { encryptedToken, recipientEmail } = body;

    if (!encryptedToken || !recipientEmail) {
      return NextResponse.json({ error: 'Pflichtfelder fehlen.' }, { status: 400 });
    }

    // Decrypt the original token
    let rawToken: string;
    try {
      rawToken = await decryptToken(encryptedToken);
    } catch {
      return NextResponse.json({ error: 'Ungültiger Token.' }, { status: 400 });
    }
    const tokenHash = await hashToken(rawToken);

    // Initiate transfer
    const result = await initiateTransfer(tokenHash, recipientEmail);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    // Encrypt the transfer token for the recipient's email
    const encryptedTransferToken = await encryptToken(result.transferToken);

    // Send transfer receipt email to recipient
    const html = buildTransferReceiptHtml(
      recipientEmail,
      result.ticketLabel,
      encryptedTransferToken,
    );

    const { error: emailError } = await sendEmail({
      to: recipientEmail,
      subject: 'Du hast ein Ticket erhalten – Startup Contacts',
      html,
    });

    if (emailError) {
      console.error('Failed to send transfer email:', emailError);
      return NextResponse.json({
        ok: true,
        warning: 'Transfer gestartet, aber E-Mail konnte nicht gesendet werden.',
      });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Transfer error:', err);
    return NextResponse.json({ error: 'Interner Fehler.' }, { status: 500 });
  }
}

/**
 * GET /api/tickets/transfer?t=<encryptedToken>
 * Check the status of a ticket for the transfer page.
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
