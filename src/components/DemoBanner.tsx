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
    <div className="bg-[#FFF8F5] sticky top-0 z-50 px-4 py-1.5 text-center text-[11px] font-semibold tracking-wide text-[#FF754B] border-b border-[rgba(255,117,75,0.1)]">
      🚧 Demo Mode — no real data
    </div>
  );
}
