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
    <div className="sticky top-0 z-50 bg-amber-500 px-4 py-1.5 text-center text-xs font-medium text-black">
      🚧 Demo Mode — no real data
    </div>
  );
}
