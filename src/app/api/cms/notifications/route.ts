import { NextRequest, NextResponse } from 'next/server';
import webpush from 'web-push';
import { createAdminClient } from '@/lib/supabase/admin';
import { verifyCmsSession } from '@/lib/cms/auth';

// Send push notification to all subscribers (CMS-protected)
export async function POST(request: NextRequest) {
  webpush.setVapidDetails(
    `mailto:admin@${new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').hostname}`,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  );
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

    const errors: { statusCode?: number; message: string; endpoint: string }[] = [];
    const expiredEndpoints: string[] = [];

    results.forEach((r, i) => {
      if (r.status === 'rejected') {
        const err = r.reason as { statusCode?: number; body?: string; message?: string };
        const statusCode = err.statusCode;
        errors.push({
          statusCode,
          message: err.body || err.message || String(r.reason),
          endpoint: subscriptions[i].endpoint.slice(0, 60) + '...',
        });
        // Only remove truly gone subscriptions (404/410)
        if (statusCode === 404 || statusCode === 410) {
          expiredEndpoints.push(subscriptions[i].endpoint);
        }
      }
    });

    if (expiredEndpoints.length > 0) {
      await supabase
        .from('push_subscriptions')
        .delete()
        .in('endpoint', expiredEndpoints);
    }

    const sent = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected').length;

    return NextResponse.json({ sent, failed, errors });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
