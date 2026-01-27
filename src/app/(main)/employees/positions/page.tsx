// Generated: 2026-01-28 00:30:00 KST

import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { PositionManager } from '@/components/features/employees/PositionManager';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function PositionsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/login');
  }

  const user = session.user as any;

  // ADMIN만 접근 가능
  if (user.role !== 'ADMIN') {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-gray-700 mb-2">접근 권한이 없습니다</h1>
          <p className="text-sm text-gray-400">직급 관리는 관리자만 할 수 있습니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/employees">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">직급 관리</h1>
          <p className="text-sm text-gray-500">직급을 생성, 수정, 삭제할 수 있습니다.</p>
        </div>
      </div>

      <PositionManager />
    </div>
  );
}
