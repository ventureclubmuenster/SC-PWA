import { NextResponse } from 'next/server';
import type { EmailOtpType } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const tokenHash = searchParams.get('token_hash');
  const type = searchParams.get('type') as EmailOtpType | null;
  const next = searchParams.get('next') ?? '/schedule';

  // Sanitize: only allow relative paths (prevent open redirect)
  const safePath = next.startsWith('/') ? next : '/schedule';

  const forwardedHost = request.headers.get('x-forwarded-host');
  const isLocalEnv = process.env.NODE_ENV === 'development';
  const redirectBase = isLocalEnv
    ? origin
    : forwardedHost
      ? `https://${forwardedHost}`
      : origin;

  const supabase = await createClient();

  // PKCE flow: exchange authorization code for session
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${redirectBase}${safePath}`);
    }
  }

  // Token-hash flow: verify OTP directly (works across browser contexts)
  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    if (!error) {
      return NextResponse.redirect(`${redirectBase}${safePath}`);
    }
  }

  // Auth error — redirect to login, preserving next intent
  const errorUrl = safePath !== '/schedule'
    ? `${origin}/?error=auth&next=${encodeURIComponent(safePath)}`
    : `${origin}/?error=auth`;
  return NextResponse.redirect(errorUrl);
}
