import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { DEMO_COOKIE } from '@/app/auth/demo/route';

export async function updateSession(request: NextRequest) {
  // Allow demo session to pass through
  const demoCookie = request.cookies.get(DEMO_COOKIE);
  if (demoCookie) {
    if (request.nextUrl.pathname === '/') {
      const url = request.nextUrl.clone();
      url.pathname = '/schedule';
      return NextResponse.redirect(url);
    }
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  let user = null;
  try {
    const result = await supabase.auth.getUser();
    user = result.data.user;
  } catch {
    // Supabase not configured — only demo mode available
  }

  // If no user and trying to access dashboard, redirect to login with return URL
  if (
    !user &&
    !request.nextUrl.pathname.startsWith('/auth') &&
    request.nextUrl.pathname !== '/'
  ) {
    const url = request.nextUrl.clone();
    const returnTo = request.nextUrl.pathname + request.nextUrl.search;
    url.pathname = '/';
    url.search = `?next=${encodeURIComponent(returnTo)}`;
    return NextResponse.redirect(url);
  }

  // If user is logged in and on login page, redirect to intended destination or schedule
  if (user && request.nextUrl.pathname === '/') {
    const url = request.nextUrl.clone();
    const next = request.nextUrl.searchParams.get('next');
    url.pathname = next || '/schedule';
    url.search = '';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
