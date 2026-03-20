'use client';

import { useEffect } from 'react';
import { haptic } from '@/lib/haptic';

export default function HapticProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('button, a, [role="button"], .card-clean, .card-accent')) {
        haptic();
      }
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  return <>{children}</>;
}
