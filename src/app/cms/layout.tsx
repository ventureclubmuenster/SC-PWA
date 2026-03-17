import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'SC CMS',
  robots: 'noindex, nofollow',
};

export default function CmsLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-950 text-white antialiased font-sans">
        {children}
      </body>
    </html>
  );
}
