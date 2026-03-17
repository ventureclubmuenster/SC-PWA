'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import FilterBar from '@/components/FilterBar';
import { Clock, MapPin } from 'lucide-react';
import type { ScheduleItem } from '@/types';

const categoryFilters = [
  { label: 'All', value: 'all' },
  { label: 'Main Stage', value: 'main-stage' },
  { label: 'Workshop', value: 'workshop' },
  { label: 'Panel', value: 'panel' },
  { label: 'Networking', value: 'networking' },
];

export default function SchedulePage() {
  const [items, setItems] = useState<ScheduleItem[]>([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from('schedule_items')
      .select('*, speaker:speaker_id(id, name, photo_url, linkedin, bio)')
      .order('time')
      .then(({ data }) => {
        setItems(data || []);
        setLoading(false);
      });
  }, []);

  const filtered = filter === 'all' ? items : items.filter((i) => i.category === filter);

  // Extract unique locations for a secondary filter
  const locations = [...new Set(items.map((i) => i.location))];
  const [locationFilter, setLocationFilter] = useState('all');
  const locationFilters = [
    { label: 'All Stages', value: 'all' },
    ...locations.map((l) => ({ label: l, value: l })),
  ];

  const finalItems =
    locationFilter === 'all'
      ? filtered
      : filtered.filter((i) => i.location === locationFilter);

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
  };

  const categoryColors: Record<string, string> = {
    'main-stage': 'bg-purple-100 text-purple-700',
    workshop: 'bg-blue-100 text-blue-700',
    panel: 'bg-amber-100 text-amber-700',
    networking: 'bg-green-100 text-green-700',
  };

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold tracking-tight">Schedule</h1>

      <FilterBar filters={categoryFilters} activeFilter={filter} onFilterChange={setFilter} />
      {locations.length > 1 && (
        <FilterBar
          filters={locationFilters}
          activeFilter={locationFilter}
          onFilterChange={setLocationFilter}
        />
      )}

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-[#E8E8ED]" />
          ))}
        </div>
      ) : finalItems.length === 0 ? (
        <p className="text-center text-sm text-[#86868B] py-12">
          No events found.
        </p>
      ) : (
        <div className="space-y-3">
          {finalItems.map((item) => (
            <div
              key={item.id}
              className="noise-panel rounded-2xl p-4 space-y-2 border border-[#E8E8ED] shadow-sm"
            >
              <div className="relative z-10 flex items-start justify-between gap-2">
                <h3 className="font-semibold text-sm">{item.title}</h3>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
                    categoryColors[item.category] || 'bg-[#F5F5F7] text-[#86868B]'
                  }`}
                >
                  {item.category.replace('-', ' ')}
                </span>
              </div>
              <div className="relative z-10 flex items-center gap-4 text-xs text-[#86868B]">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatTime(item.time)}
                  {item.end_time && ` – ${formatTime(item.end_time)}`}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {item.location}
                </span>
              </div>
              {item.speaker && (
                <p className="relative z-10 text-xs text-[#86868B]">
                  Speaker: <span className="font-medium text-[#1D1D1F]">{item.speaker.name}</span>
                </p>
              )}
              {item.description && (
                <p className="relative z-10 text-xs text-[#86868B] line-clamp-2">{item.description}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
