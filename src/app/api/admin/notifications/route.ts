import { NextRequest, NextResponse } from 'next/server';
import webpush from 'web-push';
import { createAdminClient } from '@/lib/supabase/admin';
import { verifyCmsSession } from '@/lib/admin/auth';

function initVapid() {
  webpush.setVapidDetails(
    `mailto:admin@${new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').hostname}`,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  );
}

// Fetch notification history
export async function GET() {
  const isAuthed = await verifyCmsSession();
  if (!isAuthed) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('notification_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ logs: data });
}

// Send push notification to all subscribers (admin-protected)
export async function POST(request: NextRequest) {
  initVapid();
  const isAuthed = await verifyCmsSession();
  if (!isAuthed) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const {
      title, body, url,
      icon, badge, image,
      tag, renotify, requireInteraction, silent,
      vibrate, dir, lang, actions, timestamp,
    } = await request.json();

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
      // Log even when no subscribers
      await supabase.from('notification_logs').insert({
        title, body, url, icon, badge, image, tag,
        renotify: renotify || false,
        require_interaction: requireInteraction || false,
        silent: silent || false,
        vibrate: vibrate || null,
        dir: dir || null, lang: lang || null,
        actions: actions || null,
        timestamp: timestamp || null,
        sent_count: 0, failed_count: 0, total_subscribers: 0, errors: null,
      });
      return NextResponse.json({ sent: 0, failed: 0, message: 'No subscribers' });
    }

    // Build notification payload with all supported options
    const payload: Record<string, unknown> = { title, body, url: url || '/' };
    if (icon) payload.icon = icon;
    if (badge) payload.badge = badge;
    if (image) payload.image = image;
    if (tag) payload.tag = tag;
    if (renotify) payload.renotify = true;
    if (requireInteraction) payload.requireInteraction = true;
    if (silent) payload.silent = true;
    if (vibrate) payload.vibrate = vibrate;
    if (dir && dir !== 'auto') payload.dir = dir;
    if (lang) payload.lang = lang;
    if (actions && actions.length > 0) payload.actions = actions;
    if (timestamp) payload.timestamp = new Date(timestamp).getTime();

    const results = await Promise.allSettled(
      subscriptions.map((sub) =>
        webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          JSON.stringify(payload)
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

    // Log notification
    await supabase.from('notification_logs').insert({
      title, body, url, icon, badge, image, tag,
      renotify: renotify || false,
      require_interaction: requireInteraction || false,
      silent: silent || false,
      vibrate: vibrate || null,
      dir: dir || null, lang: lang || null,
      actions: actions || null,
      timestamp: timestamp || null,
      sent_count: sent, failed_count: failed,
      total_subscribers: subscriptions.length,
      errors: errors.length > 0 ? errors : null,
    });

    return NextResponse.json({ sent, failed, errors });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
