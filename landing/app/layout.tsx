import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { MetaPixel } from '@/components/meta-pixel';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
  weight: ['300', '400', '500', '600', '700', '800'],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://jesstrading.xyz'),
  title: {
    default: 'Jess Trading — Algorithmic XAUUSD Bot',
    template: '%s · Jess Trading',
  },
  description:
    'Plug-and-play trading bot for XAUUSD. Lifetime access, one-time payment, 24/7 automated execution. Built on 5 years of verified data.',
  keywords: ['XAUUSD bot', 'gold trading bot', 'algorithmic trading', 'MT5 EA', 'forex automation'],
  openGraph: {
    title: 'Jess Trading — Algorithmic XAUUSD Bot',
    description:
      'The bot that trades XAUUSD while you sleep. Lifetime access for $147 — built on 5 years of verified data.',
    type: 'website',
    locale: 'en_US',
    siteName: 'Jess Trading',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Jess Trading — Algorithmic XAUUSD Bot',
    description:
      'The bot that trades XAUUSD while you sleep. Lifetime access for $147.',
  },
  robots: {
    index: true,
    follow: true,
  },
  verification: { other: { 'facebook-domain-verification': 'h5odawnu5owh42fee9l1qx0e8htym1' } },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#010101',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} dark`}>
      <body className="font-sans">
        <MetaPixel />
        {children}
      </body>
    </html>
  );
}
