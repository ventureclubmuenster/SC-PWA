'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Calendar, Info, Wrench, User, Users, Ticket } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useDemoUser } from '@/lib/demo';
import type { UserRole } from '@/types';

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
  const [role, setRole] = useState<UserRole>('visitor');
  const demoUser = useDemoUser();

  useEffect(() => {
    if (demoUser) {
      setRole(demoUser.role);
      return;
    }
    const fetchRole = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
        if (profile?.role) {
          setRole(profile.role as UserRole);
        }
      }
    };
    fetchRole();
  }, [demoUser]);

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
              className={`flex flex-col items-center gap-1 px-3 py-1.5 text-[11px] font-medium tracking-wide transition-colors ${
                isActive
                  ? 'text-[#FF754B]'
                  : 'text-[#86868B] hover:text-[#1D1D1F]'
              }`}
            >
              <Icon className="h-5 w-5" strokeWidth={isActive ? 2.5 : 1.5} />
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
