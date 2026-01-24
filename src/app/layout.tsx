// Generated: 2026-01-24 21:10:00 KST

import type { Metadata } from 'next';
import './globals.css';

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
      <body>{children}</body>
    </html>
  );
}
