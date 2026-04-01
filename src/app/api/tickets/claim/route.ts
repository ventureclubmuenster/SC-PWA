import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { redeemClaimToken, checkClaimTokenStatus, type ClaimProfileData } from '@/lib/ticket-claims';

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token');

  if (!token || typeof token !== 'string' || token.length !== 64) {
    return NextResponse.json({ error: 'Ungültiger Token.' }, { status: 400 });
  }

  const result = await checkClaimTokenStatus(token);
  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  // Require authenticated session
  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { error: 'Nicht authentifiziert. Bitte melde dich zuerst an.' },
      { status: 401 },
    );
  }

  // Parse and validate request body
  let body: { token?: string; profile?: ClaimProfileData };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Ungültige Anfrage.' }, { status: 400 });
  }

  const token = body.token;
  if (!token || typeof token !== 'string' || token.length !== 64) {
    return NextResponse.json({ error: 'Ungültiger Token.' }, { status: 400 });
  }

  const profile = body.profile;
  if (
    !profile ||
    !profile.firstName?.trim() ||
    !profile.lastName?.trim() ||
    !profile.age ||
    !profile.attendeeRole
  ) {
    return NextResponse.json({ error: 'Bitte fülle alle Felder aus.' }, { status: 400 });
  }

  // Redeem the claim token
  const result = await redeemClaimToken(token, user.id, profile);

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ ok: true, ticketId: result.ticketId });
}
