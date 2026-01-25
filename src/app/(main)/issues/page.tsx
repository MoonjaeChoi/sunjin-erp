// Generated: 2026-01-25 18:05:00 KST

import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import IssueListPageClient from './page.client';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: '장애 현황 관리',
  description: '장애 현황을 관리합니다.',
};

export default async function IssueListPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/login');
  }

  return <IssueListPageClient />;
}
