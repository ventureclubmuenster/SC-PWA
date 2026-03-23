'use client';

import { useEffect } from 'react';
import { haptic } from '@/lib/haptic';

const HAPTIC_SELECTOR = 'button, a, [role="button"], .card-clean, .card-accent';

export default function HapticProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const handler = (e: Event) => {
      const target = e.target as HTMLElement;
      if (target.closest(HAPTIC_SELECTOR)) {
        haptic();
      }
    };
    document.addEventListener('pointerdown', handler, { passive: true });
    return () => document.removeEventListener('pointerdown', handler);
  }, []);

  return <>{children}</>;
}
