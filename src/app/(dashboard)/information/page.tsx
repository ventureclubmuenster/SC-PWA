'use client';

import { useState, useMemo } from 'react';
import { usePartners, useSpeakers } from '@/components/DataProvider';
import FilterBar from '@/components/FilterBar';
import PageHeader from '@/components/PageHeader';
import DetailModal from '@/components/DetailModal';
import { StaggerList, StaggerItem, TapCard, FadeIn } from '@/components/motion';
import { Building2, Mic2, ExternalLink, Map } from 'lucide-react';
import type { Partner, Speaker } from '@/types';

const viewFilters = [
  { label: 'Partners', value: 'partners' },
  { label: 'Speakers', value: 'speakers' },
  { label: 'Lageplan', value: 'lageplan' },
];

const categoryFilters = [
  { label: 'All', value: 'all' },
  { label: 'Gold', value: 'gold' },
  { label: 'Silver', value: 'silver' },
  { label: 'Bronze', value: 'bronze' },
];

export default function InformationPage() {
  const [view, setView] = useState('partners');
  const { partners, loading: partnersLoading } = usePartners();
  const { speakers, loading: speakersLoading } = useSpeakers();
  const loading = partnersLoading || speakersLoading;
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [selectedSpeaker, setSelectedSpeaker] = useState<Speaker | null>(null);

  const filteredPartners = useMemo(
    () => categoryFilter === 'all' ? partners : partners.filter((p) => p.category === categoryFilter),
    [partners, categoryFilter],
  );

  const categoryBadge: Record<string, string> = {
    gold: 'bg-yellow-500/15 text-yellow-400',
    silver: 'bg-gray-500/15 text-gray-400',
    bronze: 'bg-orange-500/15 text-orange-400',
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Information" accent="Information" subtitle="Partners, Speakers & Lageplan" />

      <FilterBar filters={viewFilters} activeFilter={view} onFilterChange={setView} />

      {view === 'partners' && (
        <FilterBar
          filters={categoryFilters}
          activeFilter={categoryFilter}
          onFilterChange={setCategoryFilter}
        />
      )}

      {loading && view !== 'lageplan' ? null : view === 'partners' ? (
        <>
        {filteredPartners.length === 0 ? (
          <p className="text-center text-sm text-muted py-16">
            No partners found.
          </p>
        ) : (
          <StaggerList className="space-y-4">
            {filteredPartners.map((partner) => (
              <StaggerItem key={partner.id}>
                <TapCard
                  onClick={() => setSelectedPartner(partner)}
                  className="card-clean flex items-start gap-4 rounded-2xl p-5 cursor-pointer"
                >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl" style={{ background: 'var(--surface-2)' }}>
                  {partner.logo_url ? (
                    <img
                      src={partner.logo_url}
                      alt={partner.name}
                      className="h-8 w-8 object-contain"
                      loading="lazy"
                    />
                  ) : (
                    <Building2 className="h-5 w-5 text-muted" />
                  )}
                </div>
                <div className="flex-1 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold tracking-wide">{partner.name}</h3>
                    <span
                      className={`pill px-2.5 py-0.5 text-[10px] font-semibold ${
                        categoryBadge[partner.category]
                      }`}
                    >
                      {partner.category}
                    </span>
                  </div>
                  {partner.booth_number && (
                    <p className="text-xs text-muted">Booth {partner.booth_number}</p>
                  )}
                  {partner.description && (
                    <p className="text-xs text-muted line-clamp-2 leading-relaxed">{partner.description}</p>
                  )}
                </div>
              </TapCard>
              </StaggerItem>
            ))}
          </StaggerList>
        )}
        </>
      ) : view === 'lageplan' ? (
        <div className="card-clean rounded-2xl overflow-hidden">
          <div className="flex flex-col items-center justify-center gap-5 py-24 text-muted">
            <Map className="h-14 w-14 opacity-20" strokeWidth={1} />
            <div className="text-center space-y-2">
              <p className="text-sm font-bold text-primary tracking-wide">Lageplan</p>
              <p className="text-xs text-muted">Der Lageplan wird bald hinzugefügt.</p>
            </div>
          </div>
        </div>
      ) : speakers.length === 0 ? (
        <p className="text-center text-sm text-muted py-16">
          No speakers found.
        </p>
      ) : (
        <StaggerList className="space-y-4">
          {speakers.map((speaker) => (
            <StaggerItem key={speaker.id}>
              <TapCard
                onClick={() => setSelectedSpeaker(speaker)}
                className="card-clean flex items-start gap-4 rounded-2xl p-5 cursor-pointer"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full overflow-hidden" style={{ background: 'var(--surface-2)' }}>
                  {speaker.photo_url ? (
                    <img
                      src={speaker.photo_url}
                      alt={speaker.name}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <Mic2 className="h-5 w-5 text-muted" />
                  )}
                </div>
                <div className="flex-1 space-y-1.5">
                  <h3 className="text-sm font-bold tracking-wide">{speaker.name}</h3>
                  {speaker.bio && (
                    <p className="text-xs text-muted line-clamp-3 leading-relaxed">{speaker.bio}</p>
                  )}
                </div>
              </TapCard>
            </StaggerItem>
          ))}
        </StaggerList>
      )}

      {/* Partner Detail Modal */}
      <DetailModal open={!!selectedPartner} onClose={() => setSelectedPartner(null)}>
        {selectedPartner && (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl" style={{ background: 'var(--surface-2)' }}>
                {selectedPartner.logo_url ? (
                  <img src={selectedPartner.logo_url} alt={selectedPartner.name} className="h-10 w-10 object-contain" loading="lazy" />
                ) : (
                  <Building2 className="h-6 w-6 text-muted" />
                )}
              </div>
              <div>
                <h2 className="text-xl font-extrabold tracking-tight">{selectedPartner.name}</h2>
                <span className={`inline-block mt-1.5 pill px-2.5 py-0.5 text-xs font-semibold capitalize ${categoryBadge[selectedPartner.category]}`}>
                  {selectedPartner.category}
                </span>
              </div>
            </div>

            {selectedPartner.booth_number && (
              <div className="card-clean rounded-2xl p-4">
                <p className="text-sm text-muted">
                  <span className="font-semibold text-primary">Booth:</span> {selectedPartner.booth_number}
                </p>
              </div>
            )}

            {selectedPartner.description && (
              <div>
                <p className="section-label mb-2">About</p>
                <p className="text-sm text-muted leading-relaxed">{selectedPartner.description}</p>
              </div>
            )}

            {selectedPartner.website && (
              <a
                href={selectedPartner.website}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary inline-flex items-center gap-2 rounded-2xl px-5 py-3.5 text-sm font-semibold hover:opacity-90 transition-opacity duration-150 gradient-glow"
              >
                <ExternalLink className="h-4 w-4" />
                Website besuchen
              </a>
            )}
          </div>
        )}
      </DetailModal>

      {/* Speaker Detail Modal */}
      <DetailModal open={!!selectedSpeaker} onClose={() => setSelectedSpeaker(null)}>
        {selectedSpeaker && (
          <div className="space-y-6">
            <div className="flex flex-col items-center text-center">
              <div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-full overflow-hidden" style={{ background: 'var(--surface-2)' }}>
                {selectedSpeaker.photo_url ? (
                  <img src={selectedSpeaker.photo_url} alt={selectedSpeaker.name} className="h-full w-full object-cover" loading="lazy" />
                ) : (
                  <Mic2 className="h-10 w-10 text-muted" />
                )}
              </div>
              <p className="section-label mt-5">Speaker</p>
              <h2 className="mt-1 text-xl font-extrabold tracking-tight">{selectedSpeaker.name}</h2>
            </div>

            {selectedSpeaker.bio && (
              <div>
                <p className="section-label mb-2">About the Speaker</p>
                <p className="text-sm text-muted leading-relaxed">{selectedSpeaker.bio}</p>
              </div>
            )}

            {selectedSpeaker.linkedin && (
              <a
                href={selectedSpeaker.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary inline-flex items-center gap-2 rounded-2xl px-5 py-3.5 text-sm font-semibold hover:opacity-90 transition-opacity duration-150 gradient-glow"
              >
                <ExternalLink className="h-4 w-4" />
                LinkedIn Profil
              </a>
            )}
          </div>
        )}
      </DetailModal>
    </div>
  );
}
