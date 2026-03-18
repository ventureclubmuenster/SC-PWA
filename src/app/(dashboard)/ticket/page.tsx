'use client';

import { useEffect, useState } from 'react';
import { useProfile } from '@/components/DataProvider';
import { useDemoUser } from '@/lib/demo';
import PageHeader from '@/components/PageHeader';
import { FadeIn } from '@/components/motion';
import { QRCodeSVG } from 'qrcode.react';

async function hashId(id: string): Promise<string> {
  const data = new TextEncoder().encode(id);
  const buf = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export default function TicketPage() {
  const { profile, loading } = useProfile();
  const [qrValue, setQrValue] = useState<string | null>(null);
  const demoUser = useDemoUser();

  useEffect(() => {
    const p = demoUser || profile;
    if (p) {
      hashId(p.id).then(setQrValue);
    }
  }, [demoUser, profile]);

  if (loading) {
    return null;
  }

  return (
    <div className="space-y-5">
      <PageHeader title="Ticket" subtitle="Your event entry pass" />

      {/* Ticket Card */}
      <FadeIn delay={0.1}>
      <div className="noise-panel rounded-2xl p-6 border border-[#E8E8ED] shadow-sm">
        <div className="relative z-10 flex flex-col items-center space-y-5">
          {/* QR Code */}
          <div className="flex h-52 w-52 items-center justify-center rounded-2xl bg-white border border-[#E8E8ED]">
            {qrValue ? (
              <QRCodeSVG value={qrValue} size={180} level="M" />
            ) : null}
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
      </FadeIn>
    </div>
  );
}
