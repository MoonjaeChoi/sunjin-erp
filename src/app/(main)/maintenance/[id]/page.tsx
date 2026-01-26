// Generated: 2026-01-27 01:10:00 KST

import type { Metadata } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect, notFound } from 'next/navigation';
import MaintenanceDetailPageClient from './page.client';

export const dynamic = 'force-dynamic';

interface MaintenanceDetailPageProps {
  params: {
    id: string;
  };
}

export const metadata: Metadata = {
  title: '계약 상세 - Sunjin ERP',
  description: '유지보수 계약 상세 정보를 확인합니다.',
};

export default async function MaintenanceDetailPage({
  params,
}: MaintenanceDetailPageProps) {
  const session = await getServerSession(authOptions);

  // 인증 확인
  if (!session?.user) {
    redirect('/login');
  }

  // ID 유효성 확인
  const contractId = parseInt(params.id, 10);
  if (isNaN(contractId) || contractId <= 0) {
    notFound();
  }

  return <MaintenanceDetailPageClient contractId={contractId} />;
}
