// Generated: 2026-01-28 00:30:00 KST

import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { EmployeeList } from '@/components/features/employees/EmployeeList';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Building2, Briefcase } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function EmployeesPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/login');
  }

  const user = session.user as any;
  const userRole = user.role;
  const userDepartmentId = user.departmentId;

  // ADMIN 또는 MANAGER만 접근 가능
  if (!['ADMIN', 'MANAGER'].includes(userRole)) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-gray-700 mb-2">접근 권한이 없습니다</h1>
          <p className="text-sm text-gray-400">직원 관리는 관리자 또는 매니저만 접근할 수 있습니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">직원 관리</h1>
          <p className="mt-1 text-sm text-gray-500">
            {userRole === 'ADMIN'
              ? '전체 직원 정보를 조회하고 관리합니다.'
              : '부서 직원 정보를 조회합니다.'}
          </p>
        </div>
        {userRole === 'ADMIN' && (
          <div className="flex gap-2">
            <Link href="/employees/departments">
              <Button variant="outline" className="gap-2">
                <Building2 className="h-4 w-4" />
                부서 관리
              </Button>
            </Link>
            <Link href="/employees/positions">
              <Button variant="outline" className="gap-2">
                <Briefcase className="h-4 w-4" />
                직급 관리
              </Button>
            </Link>
          </div>
        )}
      </div>

      <EmployeeList userRole={userRole} userDepartmentId={userDepartmentId} />
    </div>
  );
}
