// Generated: 2026-01-24 21:20:00 KST

// CRITICAL: Initialize reflect-metadata globally before any other imports
import '../init-reflect-metadata';

import type { Metadata } from 'next';
import { Inter, Noto_Sans_KR } from 'next/font/google';
import { Providers } from '@/components/providers/Providers';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });
const notoSansKr = Noto_Sans_KR({ subsets: ['latin'], weight: ['400', '500', '700'] });

export const metadata: Metadata = {
  title: 'Sunjin ERP',
  description: 'Sunjin ERP System',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <head>
        <meta charSet="utf-8" />
      </head>
      <body className={`${inter.className} ${notoSansKr.className}`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
