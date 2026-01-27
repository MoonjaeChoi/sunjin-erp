// Generated: 2026-01-28 16:00:00 KST

import { getServerSession } from 'next-auth';
import { redirect, notFound } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { executeQuerySingle } from '@/lib/db-direct';
import NoticeEditClient from './_components/NoticeEditClient';

export const dynamic = 'force-dynamic';

interface Props {
  params: { id: string };
}

export async function generateMetadata({ params }: Props) {
  return {
    title: '게시물 수정 | Sunjin ERP',
  };
}

export default async function NoticeEditPage({ params }: Props) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/login');
  }

  const noticeId = parseInt(params.id, 10);

  if (isNaN(noticeId)) {
    notFound();
  }

  const user = session.user as any;

  // Check notice exists and permission
  const notice = await executeQuerySingle<any>(
    `SELECT ID, AUTHOR_ID FROM NOTICE WHERE ID = :id AND "deleted_at" IS NULL`,
    { id: noticeId }
  );

  if (!notice) {
    notFound();
  }

  // Permission check: author or ADMIN
  if (notice.AUTHOR_ID !== user.id && user.role !== 'ADMIN') {
    redirect(`/notices/${noticeId}`);
  }

  return (
    <div className="container mx-auto py-6 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">게시물 수정</h1>
        <p className="text-muted-foreground">게시물 내용을 수정합니다</p>
      </div>

      <NoticeEditClient noticeId={noticeId} />
    </div>
  );
}
