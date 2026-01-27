// Generated: 2026-01-28 16:00:00 KST

import { getServerSession } from 'next-auth';
import { redirect, notFound } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { executeQuerySingle } from '@/lib/db-direct';
import NoticeDetailClient from './_components/NoticeDetailClient';
import type { Metadata } from 'next';

// ISR (Decision #8)
export const revalidate = 3600; // 1 hour

interface Props {
  params: { id: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const noticeId = parseInt(params.id, 10);

  if (isNaN(noticeId)) {
    return { title: '게시물 없음 | Sunjin ERP' };
  }

  const notice = await executeQuerySingle<any>(
    `SELECT TITLE FROM NOTICE WHERE ID = :id AND "deleted_at" IS NULL`,
    { id: noticeId }
  );

  return {
    title: notice ? `${notice.TITLE} | Sunjin ERP` : '게시물 없음 | Sunjin ERP',
  };
}

export default async function NoticeDetailPage({ params }: Props) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/login');
  }

  const noticeId = parseInt(params.id, 10);

  if (isNaN(noticeId)) {
    notFound();
  }

  const user = session.user as any;

  return (
    <div className="container mx-auto py-6 max-w-4xl">
      <NoticeDetailClient noticeId={noticeId} userId={user.id} userRole={user.role} />
    </div>
  );
}
