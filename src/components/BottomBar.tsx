'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Calendar, Info, Users, Ticket, Map } from 'lucide-react';
import { motion } from 'framer-motion';
import { useRole } from '@/components/DataProvider';

const visitorTabs: { href: string; label: string; icon?: typeof Calendar; imageSrc?: string }[] = [
  { href: '/schedule', label: 'Schedule', icon: Calendar },
  { href: '/information', label: 'Info', icon: Info },
  { href: '/home', label: 'Home', imageSrc: '/SC Logo.png' },
  { href: '/ticket', label: 'Ticket', icon: Ticket },
  { href: '/lageplan', label: 'Lageplan', icon: Map },
];

const exhibitorTabs: { href: string; label: string; icon?: typeof Calendar; imageSrc?: string }[] = [
  { href: '/applicants', label: 'Bewerber', icon: Users },
  { href: '/lageplan', label: 'Lageplan', icon: Map },
];

export default function BottomBar() {
  const pathname = usePathname();
  const role = useRole();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const tabs = role === 'exhibitor' ? exhibitorTabs : visitorTabs;

  return (
    <div suppressHydrationWarning>
      {mounted && (
        <>
          <div className="pointer-events-none fixed bottom-0 left-0 right-0 z-40 h-24 bg-gradient-to-t from-background to-transparent" />
          <nav className="fixed bottom-0 left-0 right-0 z-50 safe-area-bottom">
            <div className="flex justify-center pb-5 pwa-bottom-offset">
              <div className="bottom-nav-floating flex items-center gap-1 px-2 py-2 pill">
                {tabs.map((tab) => {
                  const isActive = pathname === tab.href;
                  const Icon = tab.icon;
                  return (
                    <Link
                      key={tab.href}
                      href={tab.href}
                      className="relative flex flex-col items-center justify-center pill px-4 py-2 text-[11px] font-medium tracking-wide"
                    >
                      {isActive && (
                        <motion.div
                          layoutId="bottombar-active"
                          className="absolute inset-0 pill"
                          style={{ background: 'var(--highlight)' }}
                          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                        />
                      )}
                      <motion.div
                        whileTap={{ scale: 0.85, transition: { duration: 0.1 } }}
                        className="relative z-10"
                      >
                        {Icon ? (
                          <Icon
                            className={`h-5 w-5 transition-colors duration-200 ${isActive ? '' : 'tab-inactive'}`}
                            style={isActive ? { color: 'var(--highlight-text)' } : undefined}
                            strokeWidth={isActive ? 2.2 : 1.5}
                          />
                        ) : tab.imageSrc ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={tab.imageSrc}
                            alt={tab.label}
                            className={`h-9 w-9 object-contain transition-opacity duration-200 ${isActive ? '' : 'opacity-50'}`}
                          />
                        ) : null}
                      </motion.div>
                      <span className={`relative z-10 text-[10px] transition-colors duration-200 ${isActive ? '' : 'tab-inactive'}`} style={isActive ? { color: 'var(--highlight-text)' } : undefined}>
                        {tab.label}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </nav>
        </>
      )}
    </div>
  );
}
