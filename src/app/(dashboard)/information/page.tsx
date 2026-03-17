'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import FilterBar from '@/components/FilterBar';
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
    gold: 'bg-yellow-900/50 text-yellow-300',
    silver: 'bg-gray-700/50 text-gray-300',
    bronze: 'bg-orange-900/50 text-orange-300',
  };

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Information</h1>

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
            <div key={i} className="h-20 animate-pulse rounded-xl bg-gray-800" />
          ))}
        </div>
      ) : view === 'partners' ? (
        filteredPartners.length === 0 ? (
          <p className="text-center text-sm text-gray-500 py-12">
            No partners found.
          </p>
        ) : (
          <div className="space-y-3">
            {filteredPartners.map((partner) => (
              <div
                key={partner.id}
                className="flex items-start gap-3 rounded-xl bg-gray-900 p-4 border border-gray-800"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-800">
                  {partner.logo_url ? (
                    <img
                      src={partner.logo_url}
                      alt={partner.name}
                      className="h-8 w-8 object-contain"
                    />
                  ) : (
                    <Building2 className="h-5 w-5 text-gray-500" />
                  )}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold">{partner.name}</h3>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                        categoryBadge[partner.category]
                      }`}
                    >
                      {partner.category}
                    </span>
                  </div>
                  {partner.booth_number && (
                    <p className="text-xs text-gray-500">Booth {partner.booth_number}</p>
                  )}
                  {partner.description && (
                    <p className="text-xs text-gray-400 line-clamp-2">{partner.description}</p>
                  )}
                  {partner.website && (
                    <a
                      href={partner.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300"
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
        <p className="text-center text-sm text-gray-500 py-12">
          No speakers found.
        </p>
      ) : (
        <div className="space-y-3">
          {speakers.map((speaker) => (
            <div
              key={speaker.id}
              className="flex items-start gap-3 rounded-xl bg-gray-900 p-4 border border-gray-800"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-800 overflow-hidden">
                {speaker.photo_url ? (
                  <img
                    src={speaker.photo_url}
                    alt={speaker.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <Mic2 className="h-5 w-5 text-gray-500" />
                )}
              </div>
              <div className="flex-1 space-y-1">
                <h3 className="text-sm font-semibold">{speaker.name}</h3>
                {speaker.bio && (
                  <p className="text-xs text-gray-400 line-clamp-3">{speaker.bio}</p>
                )}
                {speaker.linkedin && (
                  <a
                    href={speaker.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300"
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
