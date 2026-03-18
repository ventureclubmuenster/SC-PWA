import { NextResponse } from 'next/server';
import { verifyCmsSession } from '@/lib/admin/auth';
import { getRecentWebhookEvents } from '@/app/api/webhooks/tickets/route';

/** GET /api/admin/webhooks — returns recent webhook events (admin only) */
export async function GET() {
  const isAdmin = await verifyCmsSession();
  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.json(getRecentWebhookEvents());
}
