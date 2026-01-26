// Generated: 2026-01-26 15:00:00 KST

import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import InventoryListPageClient from './page.client';

export const dynamic = 'force-dynamic';

export const metadata = {
  title: '재고 관리',
  description: '장비 재고를 관리합니다.',
};

export default async function InventoryListPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/login');
  }

  return <InventoryListPageClient />;
}
