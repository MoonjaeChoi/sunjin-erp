// Generated: 2026-01-28 16:00:00 KST

import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import NoticeForm from '../_components/NoticeForm';

export const metadata = {
  title: '게시물 작성 | Sunjin ERP',
};

export default async function NewNoticePage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/login');
  }

  const user = session.user as any;

  // MANAGER or ADMIN only
  if (!['MANAGER', 'ADMIN'].includes(user.role)) {
    redirect('/notices');
  }

  return (
    <div className="container mx-auto py-6 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">게시물 작성</h1>
        <p className="text-muted-foreground">새로운 게시물을 작성합니다</p>
      </div>

      <NoticeForm mode="create" />
    </div>
  );
}
