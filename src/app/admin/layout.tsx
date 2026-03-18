import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin Panel',
  robots: 'noindex, nofollow',
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-[#F5F5F7] text-[#1D1D1F] antialiased font-sans">
        {children}
      </body>
    </html>
  );
}
