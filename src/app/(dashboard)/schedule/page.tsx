'use client';

import { useState } from 'react';
import { useSchedule } from '@/components/DataProvider';
import FilterBar from '@/components/FilterBar';
import PageHeader from '@/components/PageHeader';
import DetailModal from '@/components/DetailModal';
import { StaggerList, StaggerItem, TapCard, FadeIn } from '@/components/motion';
import { MapPin, Mic2, Clock, ExternalLink, ChevronRight } from 'lucide-react';
import type { ScheduleItem, Speaker } from '@/types';

const categoryFilters = [
  { label: 'All', value: 'all' },
  { label: 'Keynote', value: 'keynote' },
  { label: 'Workshop', value: 'workshop' },
  { label: 'Podcast', value: 'podcast' },
  { label: 'Event', value: 'event' },
];

export default function SchedulePage() {
  const { items, loading } = useSchedule();
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState<ScheduleItem | null>(null);
  const [selectedSpeaker, setSelectedSpeaker] = useState<Speaker | null>(null);

  const filtered = filter === 'all' ? items : items.filter((i) => i.category === filter);

  const locations = [...new Set(items.map((i) => i.location))];
  const [locationFilter, setLocationFilter] = useState('all');
  const locationFilters = [
    { label: 'All Stages', value: 'all' },
    ...locations.map((l) => ({ label: l, value: l })),
  ];

  const filteredByLocation =
    locationFilter === 'all'
      ? filtered
      : filtered.filter((i) => i.location === locationFilter);

  // Sort by time-of-day (all events occur on the same date)
  const finalItems = [...filteredByLocation].sort((a, b) => {
    const ta = new Date(a.time).getHours() * 60 + new Date(a.time).getMinutes();
    const tb = new Date(b.time).getHours() * 60 + new Date(b.time).getMinutes();
    return ta - tb;
  });

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
  };

  const categoryDot: Record<string, string> = {
    keynote: 'bg-purple-500',
    workshop: 'bg-blue-500',
    podcast: 'bg-amber-500',
    event: 'bg-green-500',
  };

  const categoryColors: Record<string, string> = {
    keynote: 'bg-purple-500/15 text-purple-400',
    workshop: 'bg-blue-500/15 text-blue-400',
    podcast: 'bg-amber-500/15 text-amber-400',
    event: 'bg-green-500/15 text-green-400',
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
      <PageHeader title="Schedule" accent="Schedule" subtitle="Today's event programme" />

      <FilterBar filters={categoryFilters} activeFilter={filter} onFilterChange={setFilter} />
      {locations.length > 1 && (
        <FilterBar
          filters={locationFilters}
          activeFilter={locationFilter}
          onFilterChange={setLocationFilter}
        />
      )}

      {loading ? null : finalItems.length === 0 ? (
        <FadeIn>
          <p className="text-center text-sm text-muted py-12">
            No events found.
          </p>
        </FadeIn>
      ) : (
        <div className="relative pl-6">
          {/* Timeline spine */}
          <div className="absolute left-[5px] top-2 bottom-2 w-[2px]" style={{ background: 'var(--border)' }} />

          <StaggerList className="space-y-0">
            {timeGroups.map((group, gIdx) => {
              const isLast = gIdx === timeGroups.length - 1;
              return (
                <StaggerItem key={group.time + gIdx} className={`relative ${isLast ? '' : 'mb-3'}`}>
                  {/* Timeline node */}
                  <div className="absolute -left-6 top-1 z-10 flex items-center justify-center w-[12px]">
                    <div
                      className={`h-3 w-3 rounded-full ring-[3px] ${
                        group.items.length === 1
                          ? (categoryDot[group.items[0].category] || 'bg-muted')
                          : ''
                      }`}
                      style={{
                        boxShadow: '0 0 0 3px var(--background)',
                        ...(group.items.length > 1 ? { background: 'var(--foreground)' } : {}),
                      }}
                    />
                  </div>

                  {/* Cards */}
                  <div className="space-y-2">
                    <p className="text-[11px] font-bold tracking-wider text-muted uppercase">
                      {group.time}
                      {group.items[0].end_time && group.items.length === 1 && ` – ${formatTime(group.items[0].end_time)}`}
                    </p>

                    {group.items.length === 1 ? (
                      <TapCard onClick={() => setSelected(group.items[0])} className="cursor-pointer">
                        <EventCard item={group.items[0]} categoryColors={categoryColors} formatTime={formatTime} />
                      </TapCard>
                    ) : (
                      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 -mr-4 pr-4">
                        {group.items.map((item) => (
                          <TapCard key={item.id} onClick={() => setSelected(item)} className="cursor-pointer">
                            <EventCard item={item} categoryColors={categoryColors} formatTime={formatTime} compact />
                          </TapCard>
                        ))}
                      </div>
                    )}
                  </div>
                </StaggerItem>
              );
            })}
          </StaggerList>
        </div>
      )}

      {/* Schedule Detail Modal — tall */}
      <DetailModal open={!!selected} onClose={() => setSelected(null)} tall>
        {selected && (
          <div className="space-y-6">
            <span className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${categoryColors[selected.category] || 'bg-surface-2 text-muted'}`}>
              {selected.category.charAt(0).toUpperCase() + selected.category.slice(1)}
            </span>

            <h2 className="text-2xl font-extrabold tracking-tight leading-tight uppercase">{selected.title}</h2>

            <div className="grid grid-cols-2 gap-3">
              <div className="card-clean rounded-xl p-3">
                <div className="flex items-center gap-2 text-muted">
                  <Clock className="h-4 w-4 shrink-0" />
                  <div>
                    <p className="text-[10px] uppercase tracking-wider font-semibold">Time</p>
                    <p className="text-sm font-semibold text-primary">
                      {formatTime(selected.time)}
                      {selected.end_time && ` – ${formatTime(selected.end_time)}`}
                    </p>
                  </div>
                </div>
              </div>
              <div className="card-clean rounded-xl p-3">
                <div className="flex items-center gap-2 text-muted">
                  <MapPin className="h-4 w-4 shrink-0" />
                  <div>
                    <p className="text-[10px] uppercase tracking-wider font-semibold">Location</p>
                    <p className="text-sm font-semibold text-primary">{selected.location}</p>
                  </div>
                </div>
              </div>
            </div>

            {selected.speaker && (
              <TapCard
                onClick={() => { setSelectedSpeaker(selected.speaker!); setSelected(null); }}
                className="w-full card-clean rounded-xl p-4 text-left cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border overflow-hidden" style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}>
                    {selected.speaker.photo_url ? (
                      <img src={selected.speaker.photo_url} alt={selected.speaker.name} className="h-full w-full object-cover" />
                    ) : (
                      <Mic2 className="h-5 w-5 text-muted" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold">{selected.speaker.name}</p>
                    <p className="text-xs text-muted">Speaker</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted shrink-0" />
                </div>
              </TapCard>
            )}

            {selected.description && (
              <div>
                <p className="section-label mb-2">About</p>
                <p className="text-sm leading-relaxed">{selected.description}</p>
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
              <div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-full border overflow-hidden" style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}>
                {selectedSpeaker.photo_url ? (
                  <img src={selectedSpeaker.photo_url} alt={selectedSpeaker.name} className="h-full w-full object-cover" />
                ) : (
                  <Mic2 className="h-10 w-10 text-muted" />
                )}
              </div>
              <p className="section-label mt-4">Speaker</p>
              <h2 className="mt-1 text-xl font-extrabold tracking-tight uppercase">{selectedSpeaker.name}</h2>
            </div>

            {selectedSpeaker.bio && (
              <p className="text-sm text-muted leading-relaxed">{selectedSpeaker.bio}</p>
            )}

            {selectedSpeaker.linkedin && (
              <a
                href={selectedSpeaker.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-dark inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold hover:opacity-90 transition-opacity duration-150"
              >
                <ExternalLink className="h-4 w-4" />
                LinkedIn Profile
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
    <div className={`card-clean rounded-2xl p-4 space-y-2 ${compact ? 'min-w-[200px] flex-shrink-0' : ''}`}>
      {compact && item.end_time && (
        <p className="text-[10px] font-bold tracking-wider text-muted uppercase">
          until {formatTime(item.end_time)}
        </p>
      )}
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-bold text-sm uppercase tracking-wide">{item.title}</h3>
        <span
          className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
            categoryColors[item.category] || 'bg-surface-2 text-muted'
          }`}
        >
          {item.category.charAt(0).toUpperCase() + item.category.slice(1)}
        </span>
      </div>

      <div className="flex items-center gap-3 text-xs text-muted">
        <span className="flex items-center gap-1">
          <MapPin className="h-3 w-3" />
          {item.location}
        </span>
        {item.speaker && (
          <span className="flex items-center gap-1">
            <Mic2 className="h-3 w-3" />
            <span className="font-semibold" style={{ color: 'var(--accent)' }}>{item.speaker.name}</span>
          </span>
        )}
      </div>

      {item.description && (
        <p className="text-xs text-muted line-clamp-2">{item.description}</p>
      )}
    </div>
  );
}
