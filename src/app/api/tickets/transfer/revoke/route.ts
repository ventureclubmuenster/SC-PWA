import { NextRequest, NextResponse } from 'next/server';
import { decryptToken } from '@/lib/ticket-encryption';
import { hashToken, revokeTransfer } from '@/lib/ticket-claims';

/**
 * POST /api/tickets/transfer/revoke
 * Revoke a pending ticket transfer.
 *
 * Body: { encryptedToken }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { encryptedToken } = body;

    if (!encryptedToken) {
      return NextResponse.json({ error: 'Token fehlt.' }, { status: 400 });
    }

    let rawToken: string;
    try {
      rawToken = await decryptToken(encryptedToken);
    } catch {
      return NextResponse.json({ error: 'Ungültiger Token.' }, { status: 400 });
    }
    const tokenHash = await hashToken(rawToken);

    const result = await revokeTransfer(tokenHash);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Revoke transfer error:', err);
    return NextResponse.json({ error: 'Interner Fehler.' }, { status: 500 });
  }
}
