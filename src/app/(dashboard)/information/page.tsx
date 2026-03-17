'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import FilterBar from '@/components/FilterBar';
import PageHeader from '@/components/PageHeader';
import { Building2, Mic2, ExternalLink } from 'lucide-react';
import type { Partner, Speaker } from '@/types';

const viewFilters = [
  { label: 'Partners', value: 'partners' },
  { label: 'Speakers', value: 'speakers' },
];

const categoryFilters = [
  { label: 'All', value: 'all' },
  { label: 'Gold', value: 'gold' },
  { label: 'Silver', value: 'silver' },
  { label: 'Bronze', value: 'bronze' },
];

export default function InformationPage() {
  const [view, setView] = useState('partners');
  const [partners, setPartners] = useState<Partner[]>([]);
  const [speakers, setSpeakers] = useState<Speaker[]>([]);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    Promise.all([
      supabase.from('partners').select('*').order('category').order('name'),
      supabase.from('speakers').select('*').order('name'),
    ])
      .then(([{ data: p }, { data: s }]) => {
        setPartners(p || []);
        setSpeakers(s || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

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
    <div className="space-y-6">
      <PageHeader title="Information" subtitle="Partners & speakers" />

      <FilterBar filters={viewFilters} activeFilter={view} onFilterChange={setView} />

      {view === 'partners' && (
        <FilterBar
          filters={categoryFilters}
          activeFilter={categoryFilter}
          onFilterChange={setCategoryFilter}
        />
      )}

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-2xl bg-[#E8E8ED]" />
          ))}
        </div>
      ) : view === 'partners' ? (
        filteredPartners.length === 0 ? (
          <p className="text-center text-sm text-[#86868B] py-12">
            No partners found.
          </p>
        ) : (
          <div className="space-y-4">
            {filteredPartners.map((partner) => (
              <div
                key={partner.id}
                className="noise-panel flex items-start gap-4 rounded-2xl p-5 border border-[#E8E8ED] shadow-sm"
              >
                <div className="relative z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/80 border border-[#E8E8ED]">
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
                <div className="relative z-10 flex-1 space-y-1">
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
                  {partner.website && (
                    <a
                      href={partner.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-medium text-[#FF754B] hover:text-[#E8633A]"
                    >
                      <ExternalLink className="h-3 w-3" /> Website
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      ) : speakers.length === 0 ? (
        <p className="text-center text-sm text-[#86868B] py-12">
          No speakers found.
        </p>
      ) : (
        <div className="space-y-4">
          {speakers.map((speaker) => (
            <div
              key={speaker.id}
              className="noise-panel flex items-start gap-4 rounded-2xl p-5 border border-[#E8E8ED] shadow-sm"
            >
              <div className="relative z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/80 border border-[#E8E8ED] overflow-hidden">
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
              <div className="relative z-10 flex-1 space-y-1">
                <h3 className="text-sm font-semibold">{speaker.name}</h3>
                {speaker.bio && (
                  <p className="text-xs text-[#86868B] line-clamp-3">{speaker.bio}</p>
                )}
                {speaker.linkedin && (
                  <a
                    href={speaker.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-medium text-[#FF754B] hover:text-[#E8633A]"
                  >
                    <ExternalLink className="h-3 w-3" /> LinkedIn
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
