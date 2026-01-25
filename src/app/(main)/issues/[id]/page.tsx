// Generated: 2026-01-25 22:30:00 KST

import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import IssueDetailPageClient from './page.client';

export const dynamic = 'force-dynamic';

interface IssueDetailPageProps {
  params: {
    id: string;
  };
}

export const metadata = {
  title: '장애 상세',
  description: '장애 상세 정보를 확인합니다.',
};

export default async function IssueDetailPage({ params }: IssueDetailPageProps) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/login');
  }

  return <IssueDetailPageClient issueId={parseInt(params.id)} />;
}
