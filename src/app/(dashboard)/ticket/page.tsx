'use client';

import { useEffect, useState } from 'react';
import { useProfile } from '@/components/DataProvider';
import { FadeIn } from '@/components/motion';
import PageHeader from '@/components/PageHeader';
import { QRCodeSVG } from 'qrcode.react';
import { useLanguage } from '@/lib/i18n';

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
  const { t } = useLanguage();

  useEffect(() => {
    if (profile) {
      hashId(profile.id).then(setQrValue);
    }
  }, [profile]);

  if (loading) {
    return null;
  }

  return (
    <>
      <div className="space-y-5">
        <PageHeader title={t.ticket.title} accent="Ticket" subtitle={t.ticket.subtitle} />

        {/* Ticket Card */}
        <FadeIn delay={0.1}>
          <div
            className="relative mx-auto w-full overflow-hidden rounded-3xl px-5 pt-5 pb-16"
            style={{
              background: 'var(--ticket-card)',
              boxShadow: 'var(--shadow-lg)',
            }}
          >
            {/* Top row */}
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold tracking-widest uppercase" style={{ color: 'var(--ticket-muted)' }}>
                {t.ticket.entryPass}
              </span>
              {profile?.ticket_id && (
                <span className="text-[10px] font-mono font-medium" style={{ color: 'var(--ticket-muted)' }}>
                  {profile.ticket_id}
                </span>
              )}
            </div>

            {/* QR code */}
            <div className="flex items-center justify-center py-6">
              {qrValue ? (
                <QRCodeSVG value={qrValue} size={230} level="M" bgColor="transparent" fgColor="var(--ticket-text)" />
              ) : (
                <div className="h-[230px] w-[230px] rounded-2xl" style={{ background: 'var(--surface-2)' }} />
              )}
            </div>

            {/* Bottom row — role + status */}
            <div className="absolute bottom-5 left-5 right-5 flex items-center justify-between">
              <span className="text-sm font-semibold capitalize" style={{ color: 'var(--ticket-text)' }}>
                {profile?.role || t.ticket.visitor}
              </span>
              <span className="pill px-3 py-1 text-xs font-semibold" style={{ background: 'var(--status-success-bg)', color: 'var(--status-success)' }}>
                {t.ticket.active}
              </span>
            </div>
          </div>
        </FadeIn>

        {/* Ticket info */}
        <FadeIn delay={0.2}>
          <div className="card-clean p-6 space-y-4">
            <p className="text-subtitle">{t.ticket.ticketInfo}</p>

            <div className="space-y-3">
              <InfoRow label={t.ticket.name} value={profile?.full_name || t.ticket.attendee} />
              <Divider />
              <InfoRow label={t.ticket.email} value={profile?.email || '—'} />
              {profile?.university && (
                <>
                  <Divider />
                  <InfoRow label={t.ticket.university} value={profile.university} />
                </>
              )}
              <Divider />
              <InfoRow label={t.ticket.role} value={profile?.role || t.ticket.visitor} capitalize />
              <Divider />
              <InfoRow label={t.ticket.status} value={t.ticket.active} status />
            </div>
          </div>
        </FadeIn>
      </div>
    </>
  );
}

function InfoRow({ label, value, capitalize, status }: { label: string; value: string; capitalize?: boolean; status?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-subtitle">{label}</span>
      <span
        className={`text-sm font-semibold ${capitalize ? 'capitalize' : ''}`}
        style={{ color: status ? 'var(--status-success)' : 'var(--foreground)' }}
      >
        {value}
      </span>
    </div>
  );
}

function Divider() {
  return <div className="h-px" style={{ background: 'var(--border)' }} />;
}
