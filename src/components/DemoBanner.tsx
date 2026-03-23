'use client';

import { useEffect, useState } from 'react';
import { DEMO_COOKIE } from '@/app/auth/demo/route';

export default function DemoBanner() {
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    setIsDemo(document.cookie.includes(`${DEMO_COOKIE}=`));
  }, []);

  if (!isDemo) return null;

  return (
    <div className="sticky top-0 z-50 px-4 py-1.5 text-center text-[11px] font-semibold tracking-wide border-b" style={{ background: 'rgba(255,117,75,0.08)', color: 'var(--accent)', borderColor: 'rgba(255,117,75,0.15)' }}>
      🚧 Demo Mode — no real data
    </div>
  );
}
