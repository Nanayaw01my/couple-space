import type { Metadata, Viewport } from 'next';
import './globals.css';
import Providers from './providers';

export const metadata: Metadata = {
  title: 'Couple Space 💕',
  description: 'Your private space — chat, games, and grow together.',
  manifest: '/manifest.json',
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'Couple Space' },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#f43f5e',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Couple Space" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
