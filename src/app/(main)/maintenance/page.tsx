// Generated: 2026-01-27 01:00:00 KST

import type { Metadata } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import MaintenanceListPageClient from './page.client';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: '유지보수 계약 관리 - Sunjin ERP',
  description: '유지보수 계약을 관리하고 추적합니다.',
};

export default async function MaintenanceListPage() {
  const session = await getServerSession(authOptions);

  // 인증 확인
  if (!session?.user) {
    redirect('/login');
  }

  return <MaintenanceListPageClient />;
}
