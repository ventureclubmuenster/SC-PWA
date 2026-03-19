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
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-[#E8E8ED] bg-white/80 backdrop-blur-xl safe-area-bottom pwa-bottom-space">
      <div className="mx-auto flex max-w-lg items-center justify-around px-2 py-2">
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
                  className="absolute inset-0 rounded-xl bg-[#FF754B]/10"
                  transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                />
              )}
              <motion.div
                animate={isActive ? { scale: 1, y: 0 } : { scale: 1, y: 0 }}
                whileTap={{ scale: 0.85 }}
              >
                <Icon
                  className={`h-5 w-5 transition-colors ${isActive ? 'text-[#FF754B]' : 'text-[#86868B]'}`}
                  strokeWidth={isActive ? 2.5 : 1.5}
                />
              </motion.div>
              <span className={`relative z-10 transition-colors ${isActive ? 'text-[#FF754B]' : 'text-[#86868B]'}`}>
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
