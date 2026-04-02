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

  // Group items by start time
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
      <PageHeader title="Schedule" accent="Schedule" subtitle="Today's event programme" />

      <div className="space-y-3">
        <FilterBar filters={categoryFilters} activeFilter={filter} onFilterChange={setFilter} />
        {locations.length > 1 && (
          <FilterBar
            filters={locationFilters}
            activeFilter={locationFilter}
            onFilterChange={setLocationFilter}
          />
        )}
      </div>

      {loading ? null : finalItems.length === 0 ? (
        <FadeIn>
          <p className="text-center text-sm text-muted py-16">
            No events found.
          </p>
        </FadeIn>
      ) : (
        <div className="relative pl-7">
          {/* Timeline spine */}
          <div className="absolute left-[5px] top-3 bottom-3 w-[2px] rounded-full" style={{ background: 'var(--border)' }} />

          <StaggerList className="space-y-1">
            {timeGroups.map((group, gIdx) => {
              const isLast = gIdx === timeGroups.length - 1;
              return (
                <StaggerItem key={group.time + gIdx} className={`relative ${isLast ? '' : 'mb-4'}`}>
                  {/* Timeline node */}
                  <div className="absolute -left-7 top-1.5 z-10 flex items-center justify-center w-[12px]">
                    <div
                      className={`h-2.5 w-2.5 rounded-full ring-[3px] ${
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

                  {/* Time label + cards */}
                  <div className="space-y-3">
                    <p className="text-xs font-semibold text-muted">
                      {group.time}
                      {group.items[0].end_time && group.items.length === 1 && (
                        <span className="font-normal"> – {formatTime(group.items[0].end_time)}</span>
                      )}
                    </p>

                    {group.items.length === 1 ? (
                      <TapCard onClick={() => setSelected(group.items[0])} className="cursor-pointer">
                        <EventCard item={group.items[0]} categoryColors={categoryColors} formatTime={formatTime} />
                      </TapCard>
                    ) : (
                      <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1 -mr-5 pr-5">
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

      {/* Schedule Detail Modal */}
      <DetailModal open={!!selected} onClose={() => setSelected(null)} tall>
        {selected && (
          <div className="space-y-6">
            <span className={`inline-block pill px-3.5 py-1 text-xs font-semibold ${categoryColors[selected.category] || 'bg-surface-2 text-muted'}`}>
              {selected.category.charAt(0).toUpperCase() + selected.category.slice(1)}
            </span>

            <h2 className="text-2xl font-extrabold tracking-tight leading-tight">{selected.title}</h2>

            <div className="grid grid-cols-2 gap-3">
              <div className="card-clean rounded-2xl p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: 'var(--surface-2)' }}>
                    <Clock className="h-4 w-4 text-muted" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider font-semibold text-muted">Time</p>
                    <p className="text-sm font-semibold">
                      {formatTime(selected.time)}
                      {selected.end_time && ` – ${formatTime(selected.end_time)}`}
                    </p>
                  </div>
                </div>
              </div>
              <div className="card-clean rounded-2xl p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: 'var(--surface-2)' }}>
                    <MapPin className="h-4 w-4 text-muted" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider font-semibold text-muted">Location</p>
                    <p className="text-sm font-semibold">{selected.location}</p>
                  </div>
                </div>
              </div>
            </div>

            {selected.speaker && (
              <TapCard
                onClick={() => { setSelectedSpeaker(selected.speaker!); setSelected(null); }}
                className="w-full card-clean rounded-2xl p-4 text-left cursor-pointer"
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
                <p className="text-sm leading-relaxed text-muted">{selected.description}</p>
              </div>
            )}
          </div>
        )}
      </DetailModal>

      {/* Speaker Detail Modal */}
      <DetailModal open={!!selectedSpeaker} onClose={() => setSelectedSpeaker(null)}>
        {selectedSpeaker && (
          <div className="space-y-6">
            <div className="flex flex-col items-center text-center">
              <div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-full border overflow-hidden" style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}>
                {selectedSpeaker.photo_url ? (
                  <img src={selectedSpeaker.photo_url} alt={selectedSpeaker.name} className="h-full w-full object-cover" />
                ) : (
                  <Mic2 className="h-10 w-10 text-muted" />
                )}
              </div>
              <p className="section-label mt-5">Speaker</p>
              <h2 className="mt-1 text-xl font-extrabold tracking-tight">{selectedSpeaker.name}</h2>
            </div>

            {selectedSpeaker.bio && (
              <p className="text-sm text-muted leading-relaxed">{selectedSpeaker.bio}</p>
            )}

            {selectedSpeaker.linkedin && (
              <a
                href={selectedSpeaker.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-dark inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold hover:opacity-90 transition-opacity duration-150"
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
    <div className={`card-clean rounded-2xl p-5 space-y-3 ${compact ? 'min-w-[210px] flex-shrink-0' : ''}`}>
      {compact && item.end_time && (
        <p className="text-[10px] font-semibold tracking-wider text-muted uppercase">
          until {formatTime(item.end_time)}
        </p>
      )}
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-bold text-sm tracking-wide">{item.title}</h3>
        <span
          className={`shrink-0 pill px-2.5 py-0.5 text-[10px] font-semibold ${
            categoryColors[item.category] || 'bg-surface-2 text-muted'
          }`}
        >
          {item.category.charAt(0).toUpperCase() + item.category.slice(1)}
        </span>
      </div>

      <div className="flex items-center gap-3 text-xs text-muted">
        <span className="flex items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5" />
          {item.location}
        </span>
        {item.speaker && (
          <span className="flex items-center gap-1.5">
            <Mic2 className="h-3.5 w-3.5" />
            <span className="font-semibold" style={{ color: 'var(--accent)' }}>{item.speaker.name}</span>
          </span>
        )}
      </div>

      {item.description && (
        <p className="text-xs text-muted line-clamp-2 leading-relaxed">{item.description}</p>
      )}
    </div>
  );
}
