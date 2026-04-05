'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useProfile, useWorkshops, useSchedule } from '@/components/DataProvider';
import PageHeader from '@/components/PageHeader';
import { StaggerList, StaggerItem, FadeIn, TapCard } from '@/components/motion';
import { Flame, ArrowRight, Calendar, Clock, MapPin, Sparkles, Ticket, Map, Handshake, User } from 'lucide-react';
import { useLanguage } from '@/lib/i18n';

/* ── Point milestones ───────────────────────────────── */
const MILESTONES = [
  { label: 'Attendee', points: 0 },
  { label: 'Creator', points: 100 },
  { label: 'Builder', points: 250 },
  { label: 'Co-Creator', points: 500 },
] as const;

const MAX_POINTS = MILESTONES[MILESTONES.length - 1].points;

// Demo value — replace with real data once the points system exists
const DEMO_POINTS = 160;

/* ── Helpers ────────────────────────────────────────── */

/* ── Page ───────────────────────────────────────────── */
export default function HomePage() {
  const { profile } = useProfile();
  const { workshops, bookings } = useWorkshops();
  const { items: schedule } = useSchedule();
  const { t, locale } = useLanguage();

  const fmt = (iso: string) =>
    new Date(iso).toLocaleTimeString(locale === 'de' ? 'de-DE' : 'en-US', { hour: '2-digit', minute: '2-digit' });

  const points = DEMO_POINTS;
  const pct = Math.min((points / MAX_POINTS) * 100, 100);

  const currentIdx = useMemo(() => {
    let idx = 0;
    for (let i = MILESTONES.length - 1; i >= 0; i--) {
      if (points >= MILESTONES[i].points) { idx = i; break; }
    }
    return idx;
  }, [points]);

  const nextMilestone = currentIdx < MILESTONES.length - 1 ? MILESTONES[currentIdx + 1] : null;

  const bookedWorkshops = useMemo(
    () => workshops.filter((ws) => bookings.some((b) => b.workshop_id === ws.id)),
    [workshops, bookings],
  );

  const upcoming = useMemo(() => {
    const now = new Date();
    return schedule
      .filter((s) => new Date(s.time) > now)
      .sort((a, b) => +new Date(a.time) - +new Date(b.time))
      .slice(0, 3);
  }, [schedule]);

  const firstName = profile?.first_name || profile?.full_name?.split(' ')[0] || 'there';

  return (
    <div className="space-y-6">
      <PageHeader title={`Hey ${firstName}`} accent={firstName} subtitle={t.home.subtitle} />

      {/* ── Points / Progress ─────────────────────────── */}
      <FadeIn delay={0.05}>
        <div className="card-glow rounded-2xl p-5 space-y-5">
          {/* Header row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: 'rgba(247,108,7,0.15)' }}
              >
                <Flame className="h-4.5 w-4.5" style={{ color: 'var(--ci-orange)' }} />
              </div>
              <span className="text-sm font-bold tracking-tight">{t.home.yourPoints}</span>
            </div>
            <span className="text-3xl font-extrabold gradient-accent-text tabular-nums">{points}</span>
          </div>

          {/* Bar */}
          <div className="space-y-2">
            <div className="relative h-3 rounded-full" style={{ background: 'var(--surface-3)' }}>
              {/* Fiery fill */}
              <div
                className="absolute inset-y-0 left-0 rounded-full overflow-hidden"
                style={{
                  width: `${pct}%`,
                  minWidth: 8,
                  background: 'linear-gradient(90deg, var(--ci-orange), var(--ci-red), #FF4500)',
                  boxShadow:
                    '0 0 14px rgba(247,108,7,0.55), 0 0 6px rgba(254,40,31,0.35)',
                  transition: 'width 1s cubic-bezier(.22,1,.36,1)',
                }}
              >
                {/* shimmer */}
                <div
                  className="absolute inset-0 opacity-40"
                  style={{
                    background:
                      'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.45) 50%, transparent 100%)',
                    animation: 'shimmer-line 2.5s ease-in-out infinite',
                  }}
                />
              </div>

              {/* Milestone dots on the track */}
              {MILESTONES.map((m, i) => {
                const pos = MAX_POINTS > 0 ? (m.points / MAX_POINTS) * 100 : 0;
                const reached = points >= m.points;
                return (
                  <div
                    key={m.label}
                    className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2"
                    style={{ left: `${pos}%` }}
                  >
                    <div
                      className="w-4 h-4 rounded-full border-2 transition-all duration-700"
                      style={{
                        background: reached
                          ? 'linear-gradient(135deg, var(--ci-orange), var(--ci-red))'
                          : 'var(--surface-2)',
                        borderColor: reached ? 'var(--ci-orange)' : 'var(--surface-3)',
                        boxShadow: reached ? '0 0 8px rgba(247,108,7,0.5)' : 'none',
                      }}
                    />
                  </div>
                );
              })}
            </div>

            {/* Labels below bar — evenly spaced */}
            <div className="flex justify-between mt-1">
              {MILESTONES.map((m) => {
                const reached = points >= m.points;
                return (
                  <div key={m.label} className="text-center">
                    <span
                      className={`text-[10px] font-semibold leading-tight block ${
                        reached ? '' : 'text-muted'
                      }`}
                      style={reached ? { color: 'var(--ci-orange)' } : undefined}
                    >
                      {m.label}
                    </span>
                    <span className="text-[9px] text-muted">{m.points}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Current-level badge */}
          <div
            className="flex items-center gap-2 rounded-xl px-3.5 py-2.5"
            style={{ background: 'rgba(247,108,7,0.08)' }}
          >
            <Sparkles className="h-4 w-4 shrink-0" style={{ color: 'var(--ci-orange)' }} />
            <span className="text-xs font-medium" style={{ color: 'var(--ci-orange)' }}>
              {t.home.level}: <strong>{MILESTONES[currentIdx].label}</strong>
              {nextMilestone && (
                <>
                  {' '}— {t.home.pointsUntil.replace('{count}', String(nextMilestone.points - points))}{' '}
                  {nextMilestone.label}
                </>
              )}
            </span>
          </div>
        </div>
      </FadeIn>

      {/* ── Angemeldete Formate ───────────────────────── */}
      <FadeIn delay={0.1}>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="section-label">{t.home.registeredFormats}</span>
            <span className="text-xs text-muted">{bookedWorkshops.length} {t.home.registrations}</span>
          </div>

          {bookedWorkshops.length > 0 ? (
            <StaggerList className="space-y-3">
              {bookedWorkshops.slice(0, 3).map((ws) => (
                <StaggerItem key={ws.id}>
                  <div className="card-clean rounded-2xl p-4 space-y-2">
                    <h4 className="text-sm font-bold">{ws.title}</h4>
                    <div className="flex items-center gap-3 text-xs text-muted">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {fmt(ws.time)}
                      </span>
                      {ws.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" /> {ws.location}
                        </span>
                      )}
                    </div>
                  </div>
                </StaggerItem>
              ))}
            </StaggerList>
          ) : (
            <div className="card-clean rounded-2xl p-6 text-center space-y-2">
              <Calendar className="h-8 w-8 mx-auto text-muted" />
              <p className="text-sm text-muted">{t.home.noRegistrations}</p>
            </div>
          )}

          <Link href="/workshops">
            <div className="btn-primary rounded-2xl py-3.5 text-center text-sm font-semibold flex items-center justify-center gap-2 mt-2 active:scale-[0.98] transition-transform">
              {t.home.registerHere}
              <ArrowRight className="h-4 w-4" />
            </div>
          </Link>
        </div>
      </FadeIn>

      {/* ── Nächste Programmpunkte ────────────────────── */}
      <FadeIn delay={0.15}>
        <div className="space-y-3">
          <span className="section-label">{t.home.nextEvents}</span>

          {upcoming.length > 0 ? (
            <StaggerList className="space-y-3">
              {upcoming.map((item) => (
                <StaggerItem key={item.id}>
                  <div className="card-clean rounded-2xl p-4 flex items-center gap-4">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 text-[11px] font-bold"
                      style={{ background: 'var(--surface-3)' }}
                    >
                      {fmt(item.time)}
                    </div>
                    <div className="min-w-0 space-y-0.5">
                      <h4 className="text-sm font-bold truncate">{item.title}</h4>
                      <div className="flex items-center gap-2 text-xs text-muted">
                        {item.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" /> {item.location}
                          </span>
                        )}
                        <span className="capitalize">{item.category}</span>
                      </div>
                    </div>
                  </div>
                </StaggerItem>
              ))}
            </StaggerList>
          ) : (
            <div className="card-clean rounded-2xl p-6 text-center">
              <p className="text-sm text-muted">{t.home.noUpcoming}</p>
            </div>
          )}

          <Link href="/schedule">
            <div className="btn-glass rounded-2xl py-3 text-center text-sm font-semibold flex items-center justify-center gap-2 mt-2 active:scale-[0.98] transition-transform">
              {t.home.fullProgram}
              <ArrowRight className="h-4 w-4" />
            </div>
          </Link>
        </div>
      </FadeIn>

      {/* ── Quick Actions Grid ────────────────────────── */}
      <FadeIn delay={0.2}>
        <div className="space-y-3">
          <span className="section-label">{t.home.quickActions}</span>
          <div className="grid grid-cols-2 gap-3">
            {[
              { href: '/ticket', icon: Ticket, label: t.home.myTicket },
              { href: '/lageplan', icon: Map, label: t.home.floorPlan },
              { href: '/information', icon: Handshake, label: t.home.partnersAndSpeakers },
              { href: '/profile', icon: User, label: t.home.myProfile },
            ].map(({ href, icon: Icon, label }) => (
              <Link key={href} href={href}>
                <TapCard className="card-clean rounded-2xl p-4 flex flex-col items-center gap-2.5 cursor-pointer">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: 'var(--surface-3)' }}
                  >
                    <Icon className="h-5 w-5" style={{ color: 'var(--accent)' }} />
                  </div>
                  <span className="text-xs font-semibold">{label}</span>
                </TapCard>
              </Link>
            ))}
          </div>
        </div>
      </FadeIn>
    </div>
  );
}
