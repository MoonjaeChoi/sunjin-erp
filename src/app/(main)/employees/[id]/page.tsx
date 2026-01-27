// Generated: 2026-01-28 00:30:00 KST

import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { EmployeeDetail } from '@/components/features/employees/EmployeeDetail';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EmployeeDetailPage({ params }: PageProps) {
  const { id } = await params;
  const employeeId = parseInt(id, 10);

  if (isNaN(employeeId)) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-gray-700 mb-2">잘못된 요청</h1>
          <p className="text-sm text-gray-400">유효하지 않은 직원 ID입니다.</p>
        </div>
      </div>
    );
  }

  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/login');
  }

  const user = session.user as any;
  const userRole = user.role;

  // ADMIN 또는 MANAGER만 접근 가능
  if (!['ADMIN', 'MANAGER'].includes(userRole)) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-gray-700 mb-2">접근 권한이 없습니다</h1>
          <p className="text-sm text-gray-400">직원 상세 정보는 관리자 또는 매니저만 조회할 수 있습니다.</p>
        </div>
      </div>
    );
  }

  return <EmployeeDetail employeeId={employeeId} userRole={userRole} />;
}
