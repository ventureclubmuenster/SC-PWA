'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Calendar, Info, Wrench, User, Users, Ticket } from 'lucide-react';
import { motion } from 'framer-motion';
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
    <nav className="bottom-nav fixed bottom-0 left-0 right-0 z-50 backdrop-blur-xl safe-area-bottom pwa-bottom-space">
      <div className="mx-auto flex max-w-lg items-center py-2">
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
                <motion.div
                  layoutId="bottombar-active"
                  className="absolute inset-0 rounded-xl bg-[#FF5E00]/8"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <motion.div
                whileTap={{ scale: 0.85, transition: { duration: 0.1 } }}
              >
                <Icon
                  className={`h-5 w-5 transition-colors duration-150 ${isActive ? 'tab-active' : 'tab-inactive'}`}
                  strokeWidth={isActive ? 2.5 : 1.5}
                />
              </motion.div>
              <span className={`relative z-10 transition-colors duration-150 ${isActive ? 'tab-active' : 'tab-inactive'}`}>
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
