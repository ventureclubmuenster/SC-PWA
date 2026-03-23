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
    <div className="space-y-6">
      <PageHeader title="My Tickets" subtitle="Your event entry pass" />

      {/* Ticket Card */}
      <FadeIn delay={0.1}>
      <div className="glass-card p-7 space-y-6">
        {/* Entry Pass sub-card */}
        <div className="glass-card-inner p-5 space-y-4">
          <p className="text-subtitle">Entry Pass</p>
          <div className="flex items-center gap-5">
            {/* QR icon tile with vivid gradient */}
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl gradient-accent gradient-glow">
              {qrValue ? (
                <QRCodeSVG value={qrValue} size={56} level="M" bgColor="transparent" fgColor="#FFFFFF" />
              ) : null}
            </div>
            <div className="space-y-1.5">
              <p className="text-base font-bold tracking-tight">{profile?.full_name || 'Attendee'}</p>
              <p className="text-xs text-muted">{profile?.email || ''}</p>
              {profile?.university && (
                <p className="text-xs text-muted">{profile.university}</p>
              )}
            </div>
          </div>
        </div>

        {/* Full QR code */}
        <div className="flex justify-center">
          <div className="rounded-2xl p-5" style={{ background: 'var(--qr-bg)', boxShadow: 'var(--shadow-sm)' }}>
            {qrValue ? (
              <QRCodeSVG value={qrValue} size={180} level="M" />
            ) : null}
          </div>
        </div>

        {/* Attendee details */}
        <div className="space-y-3 pt-2">
          <div className="flex justify-between items-center">
            <span className="text-subtitle">Role</span>
            <span className="text-sm font-semibold capitalize">{profile?.role || '—'}</span>
          </div>
          <div className="h-px" style={{ background: 'var(--border)' }} />
          <div className="flex justify-between items-center">
            <span className="text-subtitle">Status</span>
            <span className="text-xs font-semibold rounded-full px-2.5 py-0.5 bg-green-500/10 text-green-400">Active</span>
          </div>
        </div>
      </div>
      </FadeIn>
    </div>
  );
}
