import { NextResponse } from 'next/server';
import { verifyPassword, createSessionToken, CMS_COOKIE } from '@/lib/cms/auth';

export async function POST(request: Request) {
  const { password } = await request.json();
  const valid = await verifyPassword(password);

  if (!valid) {
    return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
  }

  const token = await createSessionToken();
  const response = NextResponse.json({ success: true });
  response.cookies.set(CMS_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete(CMS_COOKIE);
  return response;
}
