// Generated: 2026-01-24 23:30:00 KST

import type { Metadata } from 'next';
import { Calendar } from '@/components/features/dashboard/Calendar';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: '대시보드 - Sunjin ERP',
};

export default function DashboardPage() {
  return <Calendar />;
}
