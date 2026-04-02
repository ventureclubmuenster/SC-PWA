import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
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

  const isDev = process.env.NODE_ENV === 'development';

  let user = null;
  try {
    const result = await supabase.auth.getUser();
    user = result.data.user;
  } catch {
    // Supabase not configured
  }

  // In development, skip auth and redirect login page to /schedule
  if (isDev && !user) {
    if (request.nextUrl.pathname === '/') {
      const url = request.nextUrl.clone();
      url.pathname = '/home';
      url.search = '';
      return NextResponse.redirect(url);
    }
    return supabaseResponse;
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
    url.pathname = next || '/home';
    url.search = '';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
