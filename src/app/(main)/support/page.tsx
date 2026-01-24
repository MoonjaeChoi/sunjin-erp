// Generated: 2026-01-25 06:30:00 KST

import { Suspense } from 'react';
import { Metadata } from 'next';
import { TechSupportClient } from '@/components/features/support/TechSupportClient';

export const metadata: Metadata = {
  title: '기술지원 관리 | 선진ERP',
};

export default function SupportPage() {
  return (
    <Suspense fallback={<div className="animate-pulse h-96" />}>
      <TechSupportClient />
    </Suspense>
  );
}
