'use client';

import { useState } from 'react';
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

  const filteredPartners =
    categoryFilter === 'all'
      ? partners
      : partners.filter((p) => p.category === categoryFilter);

  const categoryBadge: Record<string, string> = {
    gold: 'bg-yellow-100 text-yellow-700',
    silver: 'bg-gray-100 text-gray-600',
    bronze: 'bg-orange-100 text-orange-700',
  };

  return (
    <div className="space-y-5">
      <PageHeader title="Information" subtitle="Partners, speakers & Lageplan" />

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
          <p className="text-center text-sm text-[#86868B] py-12">
            No partners found.
          </p>
        ) : (
          <StaggerList className="space-y-3">
            {filteredPartners.map((partner) => (
              <StaggerItem key={partner.id}>
                <TapCard
                  onClick={() => setSelectedPartner(partner)}
                  className="card-clean flex items-start gap-3 rounded-2xl p-4 cursor-pointer"
                >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FAFAFA] border border-[rgba(0,0,0,0.06)]">
                  {partner.logo_url ? (
                    <img
                      src={partner.logo_url}
                      alt={partner.name}
                      className="h-8 w-8 object-contain"
                    />
                  ) : (
                    <Building2 className="h-5 w-5 text-[#86868B]" />
                  )}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold">{partner.name}</h3>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        categoryBadge[partner.category]
                      }`}
                    >
                      {partner.category}
                    </span>
                  </div>
                  {partner.booth_number && (
                    <p className="text-xs text-[#86868B]">Booth {partner.booth_number}</p>
                  )}
                  {partner.description && (
                    <p className="text-xs text-[#86868B] line-clamp-2">{partner.description}</p>
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
          <div className="flex flex-col items-center justify-center gap-4 py-16 text-[#86868B]">
            <Map className="h-14 w-14 opacity-40" strokeWidth={1} />
            <div className="text-center space-y-1">
              <p className="text-sm font-semibold text-[#1D1D1F]">Lageplan</p>
              <p className="text-xs text-[#86868B]">Der Lageplan wird bald hinzugefügt.</p>
            </div>
          </div>
        </div>
      ) : speakers.length === 0 ? (
        <p className="text-center text-sm text-[#86868B] py-12">
          No speakers found.
        </p>
      ) : (
        <>
        <StaggerList className="space-y-3">
          {speakers.map((speaker) => (
            <StaggerItem key={speaker.id}>
              <TapCard
                onClick={() => setSelectedSpeaker(speaker)}
                className="card-clean flex items-start gap-3 rounded-2xl p-4 cursor-pointer"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#FAFAFA] border border-[rgba(0,0,0,0.06)] overflow-hidden">
                  {speaker.photo_url ? (
                    <img
                      src={speaker.photo_url}
                      alt={speaker.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Mic2 className="h-5 w-5 text-[#86868B]" />
                  )}
                </div>
                <div className="flex-1 space-y-1">
                  <h3 className="text-sm font-semibold">{speaker.name}</h3>
                  {speaker.bio && (
                    <p className="text-xs text-[#86868B] line-clamp-3">{speaker.bio}</p>
                  )}
                </div>
              </TapCard>
            </StaggerItem>
          ))}
        </StaggerList>
        </>
      )}

      {/* Partner Detail Modal */}
      <DetailModal open={!!selectedPartner} onClose={() => setSelectedPartner(null)}>
        {selectedPartner && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-white border border-[rgba(0,0,0,0.06)]">
                {selectedPartner.logo_url ? (
                  <img src={selectedPartner.logo_url} alt={selectedPartner.name} className="h-10 w-10 object-contain" />
                ) : (
                  <Building2 className="h-6 w-6 text-[#86868B]" />
                )}
              </div>
              <div>
                <h2 className="text-xl font-bold tracking-tight text-[#1D1D1F]">{selectedPartner.name}</h2>
                <span className={`inline-block mt-1 rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${categoryBadge[selectedPartner.category]}`}>
                  {selectedPartner.category}
                </span>
              </div>
            </div>

            {selectedPartner.booth_number && (
              <div className="card-clean rounded-xl p-3">
                <p className="text-sm text-[#86868B]">
                  <span className="font-semibold text-[#1D1D1F]">Booth:</span> {selectedPartner.booth_number}
                </p>
              </div>
            )}

            {selectedPartner.description && (
              <p className="text-sm text-[#86868B] leading-relaxed">{selectedPartner.description}</p>
            )}

            {selectedPartner.website && (
              <a
                href={selectedPartner.website}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#1D1D1F] px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-opacity duration-150"
              >
                <ExternalLink className="h-4 w-4" />
                Visit Website
              </a>
            )}
          </div>
        )}
      </DetailModal>

      {/* Speaker Detail Modal */}
      <DetailModal open={!!selectedSpeaker} onClose={() => setSelectedSpeaker(null)}>
        {selectedSpeaker && (
          <div className="space-y-5">
            {/* Large centered photo */}
            <div className="flex flex-col items-center text-center">
              <div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-full bg-white border border-[rgba(0,0,0,0.06)] overflow-hidden">
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
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#1D1D1F] px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-opacity duration-150"
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
