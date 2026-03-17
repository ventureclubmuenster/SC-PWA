'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import FilterBar from '@/components/FilterBar';
import { CheckCircle, XCircle, Clock, User, FileText } from 'lucide-react';
import type { Applicant } from '@/types';

const statusFilters = [
  { label: 'All', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'Accepted', value: 'accepted' },
  { label: 'Rejected', value: 'rejected' },
];

export default function ApplicantsPage() {
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('applicants')
          .select('*, visitor:visitor_id(id, email, full_name, university, cv_url)')
          .eq('exhibitor_id', user.id)
          .order('created_at', { ascending: false });
        setApplicants(data || []);
      }
      setLoading(false);
    };
    load();
  }, []);

  const handleStatusChange = async (applicantId: string, status: 'accepted' | 'rejected') => {
    setUpdating(applicantId);
    const supabase = createClient();
    await supabase
      .from('applicants')
      .update({ status })
      .eq('id', applicantId);
    setApplicants((prev) =>
      prev.map((a) => (a.id === applicantId ? { ...a, status } : a))
    );
    setUpdating(null);
  };

  const filtered =
    filter === 'all' ? applicants : applicants.filter((a) => a.status === filter);

  const statusIcon = (status: string) => {
    switch (status) {
      case 'accepted':
        return <CheckCircle className="h-4 w-4 text-green-400" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-400" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-400" />;
    }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'text-green-400';
      case 'rejected':
        return 'text-red-400';
      default:
        return 'text-yellow-400';
    }
  };

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Bewerber</h1>

      <FilterBar filters={statusFilters} activeFilter={filter} onFilterChange={setFilter} />

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl bg-gray-800" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-center text-sm text-gray-500 py-12">
          No applicants found.
        </p>
      ) : (
        <div className="space-y-3">
          {filtered.map((applicant) => {
            const visitor = applicant.visitor as unknown as {
              id: string;
              email: string;
              full_name: string | null;
              university: string | null;
              cv_url: string | null;
            };
            return (
              <div
                key={applicant.id}
                className="rounded-xl bg-gray-900 p-4 space-y-3 border border-gray-800"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-800">
                      <User className="h-4 w-4 text-gray-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">
                        {visitor?.full_name || 'Unnamed'}
                      </p>
                      <p className="text-xs text-gray-500">{visitor?.email}</p>
                      {visitor?.university && (
                        <p className="text-xs text-gray-600">{visitor.university}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {statusIcon(applicant.status)}
                    <span className={`text-xs font-medium capitalize ${statusColor(applicant.status)}`}>
                      {applicant.status}
                    </span>
                  </div>
                </div>

                {visitor?.cv_url && (
                  <a
                    href={visitor.cv_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300"
                  >
                    <FileText className="h-3 w-3" /> View CV
                  </a>
                )}

                {applicant.status === 'pending' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleStatusChange(applicant.id, 'accepted')}
                      disabled={updating === applicant.id}
                      className="flex-1 rounded-lg bg-green-900/50 py-2 text-xs font-semibold text-green-300 hover:bg-green-800/50 disabled:opacity-50 transition-colors"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => handleStatusChange(applicant.id, 'rejected')}
                      disabled={updating === applicant.id}
                      className="flex-1 rounded-lg bg-red-900/50 py-2 text-xs font-semibold text-red-300 hover:bg-red-800/50 disabled:opacity-50 transition-colors"
                    >
                      Reject
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
