import { NextResponse } from 'next/server';

export const DEMO_TOKEN = 'SC-DEMO-2024-VCM';
export const DEMO_COOKIE = 'sc_demo_session';

export const DEMO_USER = {
  id: 'demo-user-visitor',
  email: 'demo@startupcontacts.de',
  full_name: 'Demo Visitor',
  role: 'visitor' as const,
  university: 'Universität Münster',
  cv_url: null,
  afterparty_rsvp: true,
  company: null,
  booth_number: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export const DEMO_EXHIBITOR = {
  id: 'demo-user-exhibitor',
  email: 'exhibitor@startupcontacts.de',
  full_name: 'Demo Exhibitor',
  role: 'exhibitor' as const,
  university: null,
  cv_url: null,
  afterparty_rsvp: false,
  company: 'Demo GmbH',
  booth_number: 'A12',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const token = searchParams.get('token');
  const role = searchParams.get('role') || 'visitor';

  if (token !== DEMO_TOKEN) {
    return NextResponse.redirect(`${origin}/?error=invalid_demo_token`);
  }

  const user = role === 'exhibitor' ? DEMO_EXHIBITOR : DEMO_USER;
  const response = NextResponse.redirect(`${origin}/schedule`);

  response.cookies.set(DEMO_COOKIE, JSON.stringify(user), {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 365, // 1 year — persistent
    path: '/',
  });

  return response;
}
