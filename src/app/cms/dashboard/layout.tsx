'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

const navItems = [
  { label: 'Dashboard', href: '/cms/dashboard' },
  { label: 'Speakers', href: '/cms/dashboard/speakers' },
  { label: 'Partners', href: '/cms/dashboard/partners' },
  { label: 'Workshops', href: '/cms/dashboard/workshops' },
  { label: 'Schedule', href: '/cms/dashboard/schedule' },
  { label: 'Notifications', href: '/cms/dashboard/notifications' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await fetch('/api/cms/auth', { method: 'DELETE' });
    router.push('/cms');
  };

  return (
    <div className="min-h-screen flex">
      <aside className="w-56 shrink-0 noise-panel border-r border-[#E8E8ED] p-4 flex flex-col">
        <h2 className="relative z-10 text-lg font-bold tracking-tight mb-6">SC CMS</h2>
        <nav className="relative z-10 space-y-1 flex-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`block rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                pathname === item.href
                  ? 'noise-panel-dark text-white shadow-sm'
                  : 'text-[#86868B] hover:bg-white/60 hover:text-[#1D1D1F]'
              }`}
            >
              {pathname === item.href ? <span className="relative z-10">{item.label}</span> : item.label}
            </Link>
          ))}
        </nav>
        <button
          onClick={handleLogout}
          className="relative z-10 mt-4 rounded-xl px-3 py-2.5 text-sm font-medium text-[#86868B] hover:bg-white/60 hover:text-[#1D1D1F] text-left transition-all"
        >
          Logout
        </button>
      </aside>
      <main className="flex-1 p-6 overflow-auto">{children}</main>
    </div>
  );
}
