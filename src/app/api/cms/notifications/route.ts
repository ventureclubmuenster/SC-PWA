import { NextRequest, NextResponse } from 'next/server';
import webpush from 'web-push';
import { createAdminClient } from '@/lib/supabase/admin';
import { verifyCmsSession } from '@/lib/cms/auth';

webpush.setVapidDetails(
  `mailto:admin@${new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').hostname}`,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

// Send push notification to all subscribers (CMS-protected)
export async function POST(request: NextRequest) {
  const isAuthed = await verifyCmsSession();
  if (!isAuthed) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { title, body, url } = await request.json();

    if (!title || !body) {
      return NextResponse.json({ error: 'Title and body are required' }, { status: 400 });
    }

    const supabase = createAdminClient();
    const { data: subscriptions, error } = await supabase
      .from('push_subscriptions')
      .select('*');

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json({ sent: 0, failed: 0, message: 'No subscribers' });
    }

    const payload = JSON.stringify({ title, body, url: url || '/' });

    const results = await Promise.allSettled(
      subscriptions.map((sub) =>
        webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          payload
        )
      )
    );

    // Remove expired/invalid subscriptions
    const expiredEndpoints = subscriptions
      .filter((_, i) => results[i].status === 'rejected')
      .map((sub) => sub.endpoint);

    if (expiredEndpoints.length > 0) {
      await supabase
        .from('push_subscriptions')
        .delete()
        .in('endpoint', expiredEndpoints);
    }

    const sent = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected').length;

    return NextResponse.json({ sent, failed });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
