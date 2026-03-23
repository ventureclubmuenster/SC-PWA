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
      <div className="card-clean rounded-2xl p-6">
        <div className="flex flex-col items-center space-y-5">
          {/* QR Code */}
          <div className="flex h-52 w-52 items-center justify-center rounded-2xl" style={{ background: 'var(--qr-bg)', border: '1px solid var(--border)' }}>
            {qrValue ? (
              <QRCodeSVG value={qrValue} size={180} level="M" />
            ) : null}
          </div>

          {/* Attendee Info */}
          <div className="w-full space-y-3 pt-4 border-t border-dashed" style={{ borderColor: 'var(--border)' }}>
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted">Name</span>
              <span className="text-sm font-semibold">
                {profile?.full_name || 'Not set'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted">Email</span>
              <span className="text-sm font-medium">
                {profile?.email || '—'}
              </span>
            </div>
            {profile?.university && (
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted">University</span>
                <span className="text-sm font-medium">
                  {profile.university}
                </span>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted">Role</span>
              <span className="text-sm font-medium capitalize">
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
