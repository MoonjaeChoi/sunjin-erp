// Generated: 2026-01-27 01:05:00 KST

import type { Metadata } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import MaintenanceCreatePageClient from './page.client';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: '신규 계약 등록 - Sunjin ERP',
  description: '새로운 유지보수 계약을 등록합니다.',
};

export default async function MaintenanceCreatePage() {
  const session = await getServerSession(authOptions);

  // 인증 확인
  if (!session?.user) {
    redirect('/login');
  }

  // RBAC: MANAGER 이상만 계약 생성 가능
  const userRole = (session.user as any).role as string;
  if (userRole === 'USER') {
    redirect('/maintenance');
  }

  return <MaintenanceCreatePageClient />;
}
