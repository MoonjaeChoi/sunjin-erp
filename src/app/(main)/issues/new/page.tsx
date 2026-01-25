// Generated: 2026-01-25 18:05:00 KST

import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import IssueCreatePageClient from './page.client';

export const metadata = {
  title: '신규 장애 등록',
  description: '새로운 장애를 등록합니다.',
};

export default async function IssueCreatePage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/login');
  }

  return <IssueCreatePageClient />;
}
