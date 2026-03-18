import { type NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';
import { CMS_COOKIE } from '@/lib/admin/auth';

async function verifyCmsCookie(request: NextRequest): Promise<boolean> {
  const session = request.cookies.get(CMS_COOKIE);
  if (!session) return false;
  const encoder = new TextEncoder();
  const data = encoder.encode(process.env.CMS_PASSWORD || '');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const expected = Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return session.value === expected;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect admin dashboard routes
  if (pathname.startsWith('/admin/dashboard')) {
    const valid = await verifyCmsCookie(request);
    if (!valid) {
      const url = request.nextUrl.clone();
      url.pathname = '/admin';
      return NextResponse.redirect(url);
    }
    return NextResponse.next({ request });
  }

  // Admin routes bypass main app auth
  if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
    return NextResponse.next({ request });
  }

  return await updateSession(request);
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icons|manifest.json|sw.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
