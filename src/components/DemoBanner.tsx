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
    <div className="sticky top-0 z-50 px-4 py-1.5 text-center text-[11px] font-semibold tracking-wide border-b" style={{ background: 'linear-gradient(135deg, rgba(255,107,53,0.08), rgba(255,60,172,0.06))', color: 'var(--accent)', borderColor: 'rgba(255,107,53,0.12)' }}>
      🚧 Demo Mode — no real data
    </div>
  );
}
