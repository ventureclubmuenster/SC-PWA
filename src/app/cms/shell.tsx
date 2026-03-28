'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { FileText, Users, Handshake, CalendarDays, Wrench, LogOut, ArrowRight } from 'lucide-react';

const navItems = [
  { label: 'Speakers', href: '/cms/speakers', icon: Users },
  { label: 'Partners', href: '/cms/partners', icon: Handshake },
  { label: 'Workshops', href: '/cms/workshops', icon: Wrench },
  { label: 'Schedule', href: '/cms/schedule', icon: CalendarDays },
];

export default function CmsShellLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  // Don't render sidebar on the login page
  if (pathname === '/cms') return <>{children}</>;

  const handleLogout = async () => {
    await fetch('/api/admin/auth', { method: 'DELETE' });
    router.push('/cms');
  };

  return (
    <div className="min-h-screen flex bg-[#f8f9fb]">
      <aside className="w-[232px] shrink-0 bg-white border-r border-gray-200/80 flex flex-col" role="complementary" aria-label="CMS sidebar">
        <div className="px-5 pt-6 pb-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
              <FileText className="h-4 w-4 text-white" aria-hidden="true" />
            </div>
            <span className="text-[15px] font-semibold text-gray-900 tracking-tight">CMS</span>
          </div>
        </div>

        <nav className="flex-1 px-3 space-y-0.5" aria-label="CMS navigation">
          {navItems.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 ${
                  active
                    ? 'bg-violet-50 text-violet-700'
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon className={`h-4 w-4 ${active ? 'text-violet-600' : 'text-gray-400'}`} aria-hidden="true" />
                {item.label}
              </Link>
            );
          })}

          <div className="!mt-4 border-t border-gray-100 pt-3">
            <Link
              href="/admin/dashboard"
              className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2"
            >
              <ArrowRight className="h-4 w-4 text-gray-400" aria-hidden="true" />
              Admin Panel
            </Link>
          </div>
        </nav>

        <div className="p-3 mt-auto border-t border-gray-100">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2"
          >
            <LogOut className="h-4 w-4 text-gray-400" aria-hidden="true" />
            Logout
          </button>
        </div>
      </aside>
      <main className="flex-1 p-8 overflow-auto">{children}</main>
    </div>
  );
}
