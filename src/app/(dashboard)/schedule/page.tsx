'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import FilterBar from '@/components/FilterBar';
import PageHeader from '@/components/PageHeader';
import DetailModal from '@/components/DetailModal';
import { MapPin, Mic2, Clock, ExternalLink, ChevronRight } from 'lucide-react';
import type { ScheduleItem, Speaker } from '@/types';

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
  const [selected, setSelected] = useState<ScheduleItem | null>(null);
  const [selectedSpeaker, setSelectedSpeaker] = useState<Speaker | null>(null);

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
    <div className="space-y-5">
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
          {[...Array(5)].map((_, i) => (
            <div key={i} className="noise-panel rounded-2xl p-4 border border-[#E8E8ED] shadow-sm space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="h-4 w-3/5 animate-pulse rounded-lg bg-[#E8E8ED]" />
                <div className="h-5 w-16 animate-pulse rounded-full bg-[#E8E8ED]" />
              </div>
              <div className="flex items-center gap-3">
                <div className="h-3 w-20 animate-pulse rounded bg-[#E8E8ED]" />
                <div className="h-3 w-24 animate-pulse rounded bg-[#E8E8ED]" />
              </div>
              <div className="h-3 w-4/5 animate-pulse rounded bg-[#E8E8ED]" />
            </div>
          ))}
        </div>
      ) : finalItems.length === 0 ? (
        <p className="text-center text-sm text-[#86868B] py-12">
          No events found.
        </p>
      ) : (
        <div className="relative pl-6">
          {/* Timeline spine — centered on the dot column */}
          <div className="absolute left-[5px] top-2 bottom-2 w-[2px] bg-[#E8E8ED]" />

          <div className="space-y-0">
            {timeGroups.map((group, gIdx) => {
              const isLast = gIdx === timeGroups.length - 1;
              return (
                <div key={group.time + gIdx} className={`relative ${isLast ? '' : 'mb-3'}`}>
                  {/* Timeline node — positioned on the spine */}
                  <div className="absolute -left-6 top-1 z-10 flex items-center justify-center w-[12px]">
                    <div className={`h-3 w-3 rounded-full ring-[3px] ring-[#F5F5F7] ${
                      group.items.length === 1
                        ? (categoryDot[group.items[0].category] || 'bg-[#86868B]')
                        : 'bg-[#1D1D1F]'
                    }`} />
                  </div>

                  {/* Cards */}
                  <div className="space-y-2">
                    {/* Shared time label */}
                    <p className="text-[11px] font-bold tracking-wider text-[#86868B] uppercase">
                      {group.time}
                      {group.items[0].end_time && group.items.length === 1 && ` – ${formatTime(group.items[0].end_time)}`}
                    </p>

                    {group.items.length === 1 ? (
                      <div onClick={() => setSelected(group.items[0])} className="cursor-pointer">
                        <EventCard item={group.items[0]} categoryColors={categoryColors} formatTime={formatTime} />
                      </div>
                    ) : (
                      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 -mr-4 pr-4">
                        {group.items.map((item) => (
                          <div key={item.id} onClick={() => setSelected(item)} className="cursor-pointer">
                            <EventCard item={item} categoryColors={categoryColors} formatTime={formatTime} compact />
                          </div>
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

      {/* Schedule Detail Modal — tall */}
      <DetailModal open={!!selected} onClose={() => setSelected(null)} tall>
        {selected && (
          <div className="space-y-6">
            {/* Category badge */}
            <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${categoryColors[selected.category] || 'bg-[#F5F5F7] text-[#86868B]'}`}>
              {selected.category.replace('-', ' ')}
            </span>

            {/* Title */}
            <h2 className="text-2xl font-bold tracking-tight text-[#1D1D1F] leading-tight">{selected.title}</h2>

            {/* Time & Location cards */}
            <div className="grid grid-cols-2 gap-3">
              <div className="noise-panel rounded-xl p-3 border border-[#E8E8ED]">
                <div className="relative z-10 flex items-center gap-2 text-[#86868B]">
                  <Clock className="h-4 w-4 shrink-0" />
                  <div>
                    <p className="text-[10px] uppercase tracking-wider font-semibold">Time</p>
                    <p className="text-sm font-semibold text-[#1D1D1F]">
                      {formatTime(selected.time)}
                      {selected.end_time && ` – ${formatTime(selected.end_time)}`}
                    </p>
                  </div>
                </div>
              </div>
              <div className="noise-panel rounded-xl p-3 border border-[#E8E8ED]">
                <div className="relative z-10 flex items-center gap-2 text-[#86868B]">
                  <MapPin className="h-4 w-4 shrink-0" />
                  <div>
                    <p className="text-[10px] uppercase tracking-wider font-semibold">Location</p>
                    <p className="text-sm font-semibold text-[#1D1D1F]">{selected.location}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Speaker — clickable */}
            {selected.speaker && (
              <button
                onClick={() => { setSelectedSpeaker(selected.speaker!); setSelected(null); }}
                className="w-full noise-panel rounded-xl p-4 border border-[#E8E8ED] text-left active:scale-[0.98] transition-transform"
              >
                <div className="relative z-10 flex items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/80 border border-[#E8E8ED] overflow-hidden">
                    {selected.speaker.photo_url ? (
                      <img src={selected.speaker.photo_url} alt={selected.speaker.name} className="h-full w-full object-cover" />
                    ) : (
                      <Mic2 className="h-5 w-5 text-[#86868B]" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#1D1D1F]">{selected.speaker.name}</p>
                    <p className="text-xs text-[#86868B]">Speaker</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-[#86868B] shrink-0" />
                </div>
              </button>
            )}

            {/* Description */}
            {selected.description && (
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[#86868B] mb-2">About</h3>
                <p className="text-sm text-[#1D1D1F] leading-relaxed">{selected.description}</p>
              </div>
            )}
          </div>
        )}
      </DetailModal>

      {/* Speaker Detail Modal */}
      <DetailModal open={!!selectedSpeaker} onClose={() => setSelectedSpeaker(null)}>
        {selectedSpeaker && (
          <div className="space-y-5">
            <div className="flex flex-col items-center text-center">
              <div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-full bg-white border-2 border-[#E8E8ED] overflow-hidden shadow-md">
                {selectedSpeaker.photo_url ? (
                  <img src={selectedSpeaker.photo_url} alt={selectedSpeaker.name} className="h-full w-full object-cover" />
                ) : (
                  <Mic2 className="h-10 w-10 text-[#86868B]" />
                )}
              </div>
              <h2 className="mt-4 text-xl font-bold tracking-tight text-[#1D1D1F]">{selectedSpeaker.name}</h2>
            </div>

            {selectedSpeaker.bio && (
              <p className="text-sm text-[#86868B] leading-relaxed">{selectedSpeaker.bio}</p>
            )}

            {selectedSpeaker.linkedin && (
              <a
                href={selectedSpeaker.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-xl noise-panel-dark px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
              >
                <ExternalLink className="relative z-10 h-4 w-4" />
                <span className="relative z-10">LinkedIn Profile</span>
              </a>
            )}
          </div>
        )}
      </DetailModal>
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
    <div className={`noise-panel rounded-2xl p-4 space-y-2 border border-[#E8E8ED] shadow-sm ${compact ? 'min-w-[200px] flex-shrink-0' : ''}`}>
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
