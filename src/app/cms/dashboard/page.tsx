'use client';

import { useEffect, useState } from 'react';

interface Counts {
  speakers: number;
  partners: number;
  workshops: number;
  schedule: number;
}

export default function CmsDashboardPage() {
  const [counts, setCounts] = useState<Counts>({ speakers: 0, partners: 0, workshops: 0, schedule: 0 });

  useEffect(() => {
    Promise.all([
      fetch('/api/cms/speakers').then((r) => r.json()),
      fetch('/api/cms/partners').then((r) => r.json()),
      fetch('/api/cms/workshops').then((r) => r.json()),
      fetch('/api/cms/schedule').then((r) => r.json()),
    ]).then(([s, p, w, sc]) => {
      setCounts({
        speakers: Array.isArray(s) ? s.length : 0,
        partners: Array.isArray(p) ? p.length : 0,
        workshops: Array.isArray(w) ? w.length : 0,
        schedule: Array.isArray(sc) ? sc.length : 0,
      });
    });
  }, []);

  const cards = [
    { label: 'Speakers', count: counts.speakers },
    { label: 'Partners', count: counts.partners },
    { label: 'Workshops', count: counts.workshops },
    { label: 'Schedule Items', count: counts.schedule },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight mb-6">Dashboard</h1>
      <div className="grid grid-cols-2 gap-4 max-w-lg">
        {cards.map((c) => (
          <div key={c.label} className="noise-panel rounded-2xl p-4 border border-[#E8E8ED] shadow-sm">
            <p className="relative z-10 text-2xl font-bold">{c.count}</p>
            <p className="relative z-10 text-sm font-medium text-[#86868B]">{c.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
