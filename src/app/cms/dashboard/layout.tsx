'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

const navItems = [
  { label: 'Dashboard', href: '/cms/dashboard' },
  { label: 'Speakers', href: '/cms/dashboard/speakers' },
  { label: 'Partners', href: '/cms/dashboard/partners' },
  { label: 'Workshops', href: '/cms/dashboard/workshops' },
  { label: 'Schedule', href: '/cms/dashboard/schedule' },
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
      <aside className="w-56 shrink-0 bg-gray-900 border-r border-gray-800 p-4 flex flex-col">
        <h2 className="text-lg font-bold mb-6">SC CMS</h2>
        <nav className="space-y-1 flex-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`block rounded-lg px-3 py-2 text-sm transition-colors ${
                pathname === item.href
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <button
          onClick={handleLogout}
          className="mt-4 rounded-lg px-3 py-2 text-sm text-gray-400 hover:bg-gray-800 hover:text-white text-left"
        >
          Logout
        </button>
      </aside>
      <main className="flex-1 p-6 overflow-auto">{children}</main>
    </div>
  );
}
