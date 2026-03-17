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
    <div className="noise-panel-accent sticky top-0 z-50 px-4 py-1.5 text-center text-[11px] font-semibold tracking-wide text-[#FF754B] border-b border-[#FFD4C4]">
      <span className="relative z-10">🚧 Demo Mode — no real data</span>
    </div>
  );
}
