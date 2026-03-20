import type { Metadata, Viewport } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Startup Contacts",
  description: "The digital operating system for the Startup Contacts trade show",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Startup Contacts",
  },
};

export const viewport: Viewport = {
  themeColor: "#FF754B",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      </head>
      <body
        className={`${montserrat.variable} antialiased bg-[#FAFAFA] text-[#1D1D1F]`}
      >
        {children}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js');
                });
              }
              // Lock orientation to portrait when running as installed PWA
              if (screen.orientation && screen.orientation.lock) {
                screen.orientation.lock('portrait').catch(() => {});
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
