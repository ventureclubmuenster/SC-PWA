import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/schedule';

  // Sanitize: only allow relative paths (prevent open redirect)
  const safePath = next.startsWith('/') ? next : '/schedule';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const forwardedHost = request.headers.get('x-forwarded-host');
      const isLocalEnv = process.env.NODE_ENV === 'development';
      const redirectBase = isLocalEnv
        ? origin
        : forwardedHost
          ? `https://${forwardedHost}`
          : origin;
      return NextResponse.redirect(`${redirectBase}${safePath}`);
    }
  }

  // Auth code error — redirect to login, preserving next intent
  const errorUrl = safePath !== '/schedule'
    ? `${origin}/?error=auth&next=${encodeURIComponent(safePath)}`
    : `${origin}/?error=auth`;
  return NextResponse.redirect(errorUrl);
}
