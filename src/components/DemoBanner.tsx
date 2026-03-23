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
    <div className="sticky top-0 z-50 px-4 py-2 text-center text-[11px] font-semibold tracking-wider" style={{ background: 'linear-gradient(135deg, rgba(255,107,53,0.06), rgba(255,60,172,0.04), rgba(139,92,246,0.03))', color: 'var(--accent)', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
      🚧 Demo Mode — no real data
    </div>
  );
}
