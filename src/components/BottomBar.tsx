'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Calendar, Info, Wrench, User, Users, Ticket } from 'lucide-react';
import { useRole } from '@/components/DataProvider';

const visitorTabs = [
  { href: '/schedule', label: 'Schedule', icon: Calendar },
  { href: '/information', label: 'Info', icon: Info },
  { href: '/workshops', label: 'Workshops', icon: Wrench },
  { href: '/ticket', label: 'Ticket', icon: Ticket },
  { href: '/profile', label: 'Profile', icon: User },
];

const exhibitorTabs = [
  { href: '/applicants', label: 'Bewerber', icon: Users },
  { href: '/profile', label: 'Profile', icon: User },
];

export default function BottomBar() {
  const pathname = usePathname();
  const role = useRole();

  const tabs = role === 'exhibitor' ? exhibitorTabs : visitorTabs;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 gpu-layer safe-area-bottom pwa-bottom-space" style={{ background: 'var(--background-raised)', boxShadow: '0 -4px 32px rgba(0,0,0,0.15), 0 -1px 8px rgba(0,0,0,0.1)' }}>
      <div className="mx-auto flex max-w-lg items-center justify-around px-3 py-2.5">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href;
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="relative flex flex-1 flex-col items-center gap-1 py-1.5 text-[11px] font-medium tracking-wide"
            >
              {isActive && (
                <div className="absolute inset-0 rounded-2xl anim-fade-in" style={{ background: 'linear-gradient(135deg, rgba(255,107,53,0.08), rgba(255,60,172,0.05), rgba(139,92,246,0.04))' }} />
              )}
              <div className="tap-card">
                <Icon
                  className="h-5 w-5 transition-colors duration-150"
                  style={{ color: isActive ? 'var(--accent)' : 'var(--muted)' }}
                  strokeWidth={isActive ? 2.5 : 1.5}
                />
              </div>
              <span
                className="relative z-10 transition-colors duration-150"
                style={{ color: isActive ? 'var(--accent)' : 'var(--muted)' }}
              >
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
