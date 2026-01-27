// Generated: 2026-01-28 00:30:00 KST

'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEmployee } from '@/hooks/useEmployees';
import { EmployeeForm } from '@/components/features/employees/EmployeeForm';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function EditEmployeePage() {
  const params = useParams();
  const router = useRouter();
  const employeeId = parseInt(params.id as string, 10);

  const { data: employee, isLoading, error } = useEmployee(employeeId);

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-600 p-4 border border-red-300 rounded-lg">
        오류: {error.message}
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-gray-700 mb-2">직원을 찾을 수 없습니다</h1>
          <p className="text-sm text-gray-400">요청한 직원이 존재하지 않습니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href={`/employees/${employeeId}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">직원 정보 수정</h1>
          <p className="text-sm text-gray-500">{employee.name}님의 정보를 수정합니다.</p>
        </div>
      </div>

      <EmployeeForm employee={employee} />
    </div>
  );
}
