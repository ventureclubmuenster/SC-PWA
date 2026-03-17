'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import FilterBar from '@/components/FilterBar';
import PageHeader from '@/components/PageHeader';
import { MapPin, Mic2 } from 'lucide-react';
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

  const categoryDot: Record<string, string> = {
    'main-stage': 'bg-purple-500',
    workshop: 'bg-blue-500',
    panel: 'bg-amber-500',
    networking: 'bg-green-500',
  };

  const categoryColors: Record<string, string> = {
    'main-stage': 'bg-purple-100 text-purple-700',
    workshop: 'bg-blue-100 text-blue-700',
    panel: 'bg-amber-100 text-amber-700',
    networking: 'bg-green-100 text-green-700',
  };

  // Group items by start time for horizontal stacking
  const timeGroups: { time: string; items: typeof finalItems }[] = [];
  for (const item of finalItems) {
    const t = formatTime(item.time);
    const existing = timeGroups.find((g) => g.time === t);
    if (existing) {
      existing.items.push(item);
    } else {
      timeGroups.push({ time: t, items: [item] });
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Schedule" subtitle="Today's event programme" />

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
        <div className="relative">
          {/* Timeline spine */}
          <div className="absolute left-[23px] top-2 bottom-2 w-[2px] bg-[#E8E8ED]" />

          <div className="space-y-0">
            {timeGroups.map((group, gIdx) => {
              const isLast = gIdx === timeGroups.length - 1;
              return (
                <div key={group.time + gIdx} className={`relative flex gap-4 ${isLast ? '' : 'mb-4'}`}>
                  {/* Timeline node */}
                  <div className="relative z-10 flex flex-col items-center pt-1">
                    <div className={`h-3 w-3 rounded-full ring-[3px] ring-[#F5F5F7] ${
                      group.items.length === 1
                        ? (categoryDot[group.items[0].category] || 'bg-[#86868B]')
                        : 'bg-[#1D1D1F]'
                    }`} />
                  </div>

                  {/* Cards */}
                  <div className="flex-1 space-y-2">
                    {/* Shared time label */}
                    <p className="text-[11px] font-bold tracking-wider text-[#86868B] uppercase">
                      {group.time}
                      {group.items[0].end_time && group.items.length === 1 && ` – ${formatTime(group.items[0].end_time)}`}
                    </p>

                    {group.items.length === 1 ? (
                      /* Single event — full width card */
                      <EventCard item={group.items[0]} categoryColors={categoryColors} formatTime={formatTime} />
                    ) : (
                      /* Multiple events — horizontal scroll */
                      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 -mr-4 pr-4">
                        {group.items.map((item) => (
                          <EventCard key={item.id} item={item} categoryColors={categoryColors} formatTime={formatTime} compact />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function EventCard({
  item,
  categoryColors,
  formatTime,
  compact,
}: {
  item: ScheduleItem;
  categoryColors: Record<string, string>;
  formatTime: (iso: string) => string;
  compact?: boolean;
}) {
  return (
    <div className={`noise-panel rounded-2xl p-5 space-y-2.5 border border-[#E8E8ED] shadow-sm ${compact ? 'min-w-[220px] flex-shrink-0' : ''}`}>
      {compact && item.end_time && (
        <p className="relative z-10 text-[10px] font-bold tracking-wider text-[#86868B] uppercase">
          until {formatTime(item.end_time)}
        </p>
      )}
      <div className="relative z-10 flex items-start justify-between gap-2">
        <h3 className="font-semibold text-sm text-[#1D1D1F]">{item.title}</h3>
        <span
          className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
            categoryColors[item.category] || 'bg-[#F5F5F7] text-[#86868B]'
          }`}
        >
          {item.category.replace('-', ' ')}
        </span>
      </div>

      <div className="relative z-10 flex items-center gap-3 text-xs text-[#86868B]">
        <span className="flex items-center gap-1">
          <MapPin className="h-3 w-3" />
          {item.location}
        </span>
        {item.speaker && (
          <span className="flex items-center gap-1">
            <Mic2 className="h-3 w-3" />
            <span className="font-medium text-[#1D1D1F]">{item.speaker.name}</span>
          </span>
        )}
      </div>

      {item.description && (
        <p className="relative z-10 text-xs text-[#86868B] line-clamp-2">{item.description}</p>
      )}
    </div>
  );
}
