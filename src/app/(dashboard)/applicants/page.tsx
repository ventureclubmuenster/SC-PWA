'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import FilterBar from '@/components/FilterBar';
import PageHeader from '@/components/PageHeader';
import { StaggerList, StaggerItem, TapButton } from '@/components/motion';
import { CheckCircle, XCircle, Clock, User, FileText, Wrench } from 'lucide-react';
import type { Applicant } from '@/types';

interface WorkshopApplicant {
  id: string;
  user_id: string;
  workshop_id: string;
  status: 'pending' | 'approved' | 'accepted' | 'rejected';
  created_at: string;
  visitor?: {
    id: string;
    email: string;
    full_name: string | null;
    university: string | null;
    cv_url: string | null;
  };
  workshop?: {
    id: string;
    title: string;
  };
}

const statusFilters = [
  { label: 'All', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'Accepted', value: 'accepted' },
  { label: 'Rejected', value: 'rejected' },
];

const viewFilters = [
  { label: 'All', value: 'all' },
  { label: 'Direct', value: 'direct' },
  { label: 'Workshops', value: 'workshops' },
];

export default function ApplicantsPage() {
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [workshopApplicants, setWorkshopApplicants] = useState<WorkshopApplicant[]>([]);
  const [filter, setFilter] = useState('all');
  const [viewFilter, setViewFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Load direct applicants
        const { data: directData } = await supabase
          .from('applicants')
          .select('*, visitor:visitor_id(id, email, full_name, university, cv_url)')
          .eq('exhibitor_id', user.id)
          .order('created_at', { ascending: false });
        setApplicants(directData || []);

        // Load workshop applicants (bookings for workshops linked to this exhibitor)
        const { data: workshops } = await supabase
          .from('workshops')
          .select('id, title')
          .eq('exhibitor_id', user.id)
          .eq('has_waiting_list', true);

        if (workshops && workshops.length > 0) {
          const workshopIds = workshops.map((w) => w.id);
          const { data: bookingData } = await supabase
            .from('workshop_bookings')
            .select('*, visitor:user_id(id, email, full_name, university, cv_url)')
            .in('workshop_id', workshopIds)
            .order('created_at', { ascending: false });

          if (bookingData) {
            const enriched = bookingData.map((b) => ({
              ...b,
              workshop: workshops.find((w) => w.id === b.workshop_id),
            }));
            setWorkshopApplicants(enriched as WorkshopApplicant[]);
          }
        }
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

  const handleWorkshopStatusChange = async (bookingId: string, status: 'accepted' | 'rejected') => {
    setUpdating(bookingId);
    const supabase = createClient();
    await supabase
      .from('workshop_bookings')
      .update({ status })
      .eq('id', bookingId);
    setWorkshopApplicants((prev) =>
      prev.map((a) => (a.id === bookingId ? { ...a, status } : a))
    );
    setUpdating(null);
  };

  const filteredDirect =
    filter === 'all' ? applicants : applicants.filter((a) => a.status === filter);
  const filteredWorkshop =
    filter === 'all' ? workshopApplicants : workshopApplicants.filter((a) => a.status === filter);

  const showDirect = viewFilter === 'all' || viewFilter === 'direct';
  const showWorkshops = viewFilter === 'all' || viewFilter === 'workshops';

  const hasNoResults = (showDirect ? filteredDirect.length : 0) + (showWorkshops ? filteredWorkshop.length : 0) === 0;

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
    <div className="space-y-5">
      <PageHeader title="Bewerber" subtitle="Review applicant profiles" />

      <FilterBar filters={statusFilters} activeFilter={filter} onFilterChange={setFilter} />
      {workshopApplicants.length > 0 && (
        <FilterBar filters={viewFilters} activeFilter={viewFilter} onFilterChange={setViewFilter} />
      )}

      {loading ? null : hasNoResults ? (
        <p className="text-center text-sm text-[#86868B] py-12">
          No applicants found.
        </p>
      ) : (
        <StaggerList className="space-y-3">
          {/* Direct applicants */}
          {showDirect && filteredDirect.map((applicant) => {
            const visitor = applicant.visitor as unknown as {
              id: string;
              email: string;
              full_name: string | null;
              university: string | null;
              cv_url: string | null;
            };
            return (
              <StaggerItem key={applicant.id}>
                <div
                  className="card-clean rounded-2xl p-4 space-y-3"
                >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#FAFAFA] border border-[rgba(0,0,0,0.06)]">
                      <User className="h-4 w-4 text-[#86868B]" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">
                        {visitor?.full_name || 'Unnamed'}
                      </p>
                      <p className="text-xs text-[#86868B]">{visitor?.email}</p>
                      {visitor?.university && (
                        <p className="text-xs text-[#86868B]">{visitor.university}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {statusIcon(applicant.status)}
                    <span className={`text-xs font-semibold capitalize ${statusColor(applicant.status)}`}>
                      {applicant.status}
                    </span>
                  </div>
                </div>

                {visitor?.cv_url && (
                  <a
                    href={visitor.cv_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-medium text-[#FF754B] hover:text-[#E8633A] transition-colors duration-150"
                  >
                    <FileText className="h-3 w-3" /> View CV
                  </a>
                )}

                {applicant.status === 'pending' && (
                  <div className="flex gap-2">
                    <TapButton
                      onClick={() => handleStatusChange(applicant.id, 'accepted')}
                      disabled={updating === applicant.id}
                      className="flex-1 rounded-xl bg-green-50 py-2.5 text-xs font-semibold text-green-600 hover:bg-green-100 disabled:opacity-50 transition-all duration-150"
                    >
                      Accept
                    </TapButton>
                    <TapButton
                      onClick={() => handleStatusChange(applicant.id, 'rejected')}
                      disabled={updating === applicant.id}
                      className="flex-1 rounded-xl bg-red-50 py-2.5 text-xs font-semibold text-red-600 hover:bg-red-100 disabled:opacity-50 transition-all duration-150"
                    >
                      Reject
                    </TapButton>
                  </div>
                )}
              </div>
              </StaggerItem>
            );
          })}

          {/* Workshop applicants */}
          {showWorkshops && filteredWorkshop.map((applicant) => {
            const visitor = applicant.visitor as unknown as {
              id: string;
              email: string;
              full_name: string | null;
              university: string | null;
              cv_url: string | null;
            };
            return (
              <StaggerItem key={`ws-${applicant.id}`}>
                <div
                  className="card-clean rounded-2xl p-4 space-y-3"
                >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 border border-blue-200">
                      <Wrench className="h-4 w-4 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">
                        {visitor?.full_name || 'Unnamed'}
                      </p>
                      <p className="text-xs text-[#86868B]">{visitor?.email}</p>
                      {visitor?.university && (
                        <p className="text-xs text-[#86868B]">{visitor.university}</p>
                      )}
                      {applicant.workshop && (
                        <p className="text-xs font-medium text-blue-600 mt-0.5">
                          Workshop: {applicant.workshop.title}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {statusIcon(applicant.status)}
                    <span className={`text-xs font-semibold capitalize ${statusColor(applicant.status)}`}>
                      {applicant.status === 'approved' ? 'pending' : applicant.status}
                    </span>
                  </div>
                </div>

                {visitor?.cv_url && (
                  <a
                    href={visitor.cv_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-medium text-[#FF754B] hover:text-[#E8633A] transition-colors duration-150"
                  >
                    <FileText className="h-3 w-3" /> View CV
                  </a>
                )}

                {applicant.status === 'pending' && (
                  <div className="flex gap-2">
                    <TapButton
                      onClick={() => handleWorkshopStatusChange(applicant.id, 'accepted')}
                      disabled={updating === applicant.id}
                      className="flex-1 rounded-xl bg-green-50 py-2.5 text-xs font-semibold text-green-600 hover:bg-green-100 disabled:opacity-50 transition-all duration-150"
                    >
                      Accept
                    </TapButton>
                    <TapButton
                      onClick={() => handleWorkshopStatusChange(applicant.id, 'rejected')}
                      disabled={updating === applicant.id}
                      className="flex-1 rounded-xl bg-red-50 py-2.5 text-xs font-semibold text-red-600 hover:bg-red-100 disabled:opacity-50 transition-all duration-150"
                    >
                      Reject
                    </TapButton>
                  </div>
                )}
              </div>
              </StaggerItem>
            );
          })}
        </StaggerList>
      )}
    </div>
  );
}
