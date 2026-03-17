import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'SC CMS',
  robots: 'noindex, nofollow',
};

export default function CmsLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-[#F5F5F7] text-[#1D1D1F] antialiased font-sans">
        {children}
      </body>
    </html>
  );
}
