// Generated: 2026-01-28 16:00:00 KST

import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import NoticeListClient from './_components/NoticeListClient';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: '공지사항 | Sunjin ERP',
};

export default async function NoticesPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/login');
  }

  const user = session.user as any;

  return (
    <div className="container mx-auto py-6">
      <NoticeListClient userRole={user.role} />
    </div>
  );
}
