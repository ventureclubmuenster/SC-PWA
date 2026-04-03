import { NextRequest, NextResponse } from 'next/server';
import { checkClaimTokenStatus } from '@/lib/ticket-claims';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token');

  if (!token || typeof token !== 'string' || token.length !== 64) {
    return NextResponse.json({ error: 'Ungültiger Token.' }, { status: 400 });
  }

  const result = await checkClaimTokenStatus(token);
  return NextResponse.json(result, {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  });
}

/**
 * Legacy claim endpoint — redirects to the new /personalize flow.
 * Kept for backwards compatibility with old claim links.
 */
export async function POST() {
  return NextResponse.json(
    { error: 'Dieser Endpunkt ist nicht mehr aktiv. Bitte nutze /personalize.' },
    { status: 410 },
  );
}
