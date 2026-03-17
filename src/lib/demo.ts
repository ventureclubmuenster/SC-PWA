'use client';

import { useState, useEffect } from 'react';
import type { Profile } from '@/types';
import { DEMO_COOKIE } from '@/app/auth/demo/route';

export function useDemoUser(): Profile | null {
  const [demoUser, setDemoUser] = useState<Profile | null>(null);

  useEffect(() => {
    const cookie = document.cookie
      .split('; ')
      .find((row) => row.startsWith(`${DEMO_COOKIE}=`))
      ?.split('=')
      .slice(1)
      .join('=');

    if (cookie) {
      try {
        setDemoUser(JSON.parse(decodeURIComponent(cookie)));
      } catch {
        // ignore
      }
    }
  }, []);

  return demoUser;
}

export function isDemoMode(): boolean {
  if (typeof document === 'undefined') return false;
  return document.cookie.includes(`${DEMO_COOKIE}=`);
}
