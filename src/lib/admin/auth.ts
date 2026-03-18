import { cookies } from 'next/headers';

export const CMS_COOKIE = 'cms_session';

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function verifyCmsSession(): Promise<boolean> {
  const cookieStore = await cookies();
  const session = cookieStore.get(CMS_COOKIE);
  if (!session) return false;
  const expected = await hashPassword(process.env.CMS_PASSWORD || '');
  return session.value === expected;
}

export async function verifyPassword(password: string): Promise<boolean> {
  return password === (process.env.CMS_PASSWORD || '');
}

export async function createSessionToken(): Promise<string> {
  return await hashPassword(process.env.CMS_PASSWORD || '');
}
