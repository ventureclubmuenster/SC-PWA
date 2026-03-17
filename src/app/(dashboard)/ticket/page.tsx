'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useDemoUser } from '@/lib/demo';
import PageHeader from '@/components/PageHeader';
import { QrCode } from 'lucide-react';
import type { Profile } from '@/types';

export default function TicketPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const demoUser = useDemoUser();

  useEffect(() => {
    const load = async () => {
      if (demoUser) {
        setProfile(demoUser);
        setLoading(false);
        return;
      }
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        if (data) setProfile(data);
      }
      setLoading(false);
    };
    load();
  }, [demoUser]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-16 animate-pulse rounded-2xl bg-[#E8E8ED]" />
        <div className="h-80 animate-pulse rounded-2xl bg-[#E8E8ED]" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <PageHeader title="Ticket" subtitle="Your event entry pass" />

      {/* Ticket Card */}
      <div className="noise-panel rounded-2xl p-6 border border-[#E8E8ED] shadow-sm">
        <div className="relative z-10 flex flex-col items-center space-y-5">
          {/* QR Code Placeholder */}
          <div className="flex h-52 w-52 items-center justify-center rounded-2xl bg-white border-2 border-dashed border-[#E8E8ED]">
            <div className="flex flex-col items-center gap-3 text-[#86868B]">
              <QrCode className="h-16 w-16" strokeWidth={1} />
              <span className="text-xs font-medium">QR Code</span>
            </div>
          </div>

          {/* Attendee Info */}
          <div className="w-full space-y-3 pt-4 border-t border-dashed border-[#E8E8ED]">
            <div className="flex justify-between items-center">
              <span className="text-xs text-[#86868B]">Name</span>
              <span className="text-sm font-semibold text-[#1D1D1F]">
                {profile?.full_name || 'Not set'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-[#86868B]">Email</span>
              <span className="text-sm font-medium text-[#1D1D1F]">
                {profile?.email || '—'}
              </span>
            </div>
            {profile?.university && (
              <div className="flex justify-between items-center">
                <span className="text-xs text-[#86868B]">University</span>
                <span className="text-sm font-medium text-[#1D1D1F]">
                  {profile.university}
                </span>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span className="text-xs text-[#86868B]">Role</span>
              <span className="text-sm font-medium text-[#1D1D1F] capitalize">
                {profile?.role || '—'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
