import type { Metadata } from 'next';
import CmsShellLayout from './shell';

export const metadata: Metadata = {
  title: 'CMS',
  robots: 'noindex, nofollow',
};

export default function CmsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-[#f8f9fb] text-gray-900 antialiased font-sans" style={{ colorScheme: 'light' }}>
      <CmsShellLayout>{children}</CmsShellLayout>
    </div>
  );
}
