// Generated: 2026-01-28 00:30:00 KST

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useEmployee } from '@/hooks/useEmployees';
import { UserRole, UserRoleLabel, UserRoleColors } from '@/types/employee';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EmployeeAccountTab } from './EmployeeAccountTab';
import { EmployeeHistoryTab } from './EmployeeHistoryTab';
import { Edit2, ArrowLeft, Loader2 } from 'lucide-react';

interface EmployeeDetailProps {
  employeeId: number;
  userRole: UserRole;
}

export function EmployeeDetail({ employeeId, userRole }: EmployeeDetailProps) {
  const { data: employee, isLoading, error } = useEmployee(employeeId);
  const [activeTab, setActiveTab] = useState('info');

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
      <div className="text-gray-500 p-4 text-center">
        직원을 찾을 수 없습니다.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link href="/employees">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{employee.name}</h1>
            <p className="text-sm text-gray-500">
              {employee.department.name} · {employee.position.name}
            </p>
          </div>
        </div>
        {userRole === 'ADMIN' && (
          <Link href={`/employees/${employeeId}/edit`}>
            <Button className="gap-2">
              <Edit2 className="h-4 w-4" />
              수정
            </Button>
          </Link>
        )}
      </div>

      {/* 탭 */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="info">기본정보</TabsTrigger>
          {userRole === 'ADMIN' && <TabsTrigger value="account">계정</TabsTrigger>}
          {userRole === 'ADMIN' && <TabsTrigger value="history">변경이력</TabsTrigger>}
        </TabsList>

        {/* 기본정보 탭 */}
        <TabsContent value="info" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>연락처 정보</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">이메일</dt>
                  <dd className="mt-1">{employee.email}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">전화번호</dt>
                  <dd className="mt-1">{employee.phone || '-'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">직무</dt>
                  <dd className="mt-1">{employee.jobTitle || '-'}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>소속 정보</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">부서</dt>
                  <dd className="mt-1">{employee.department.name} ({employee.department.code})</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">직급</dt>
                  <dd className="mt-1">{employee.position.name} (Lv.{employee.position.level})</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">상위 매니저</dt>
                  <dd className="mt-1">
                    {employee.manager ? (
                      <Link href={`/employees/${employee.manager.id}`} className="text-blue-600 hover:underline">
                        {employee.manager.name}
                      </Link>
                    ) : '-'}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>추가 정보</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">입사일</dt>
                  <dd className="mt-1">
                    {employee.hiredAt ? new Date(employee.hiredAt).toLocaleDateString('ko-KR') : '-'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">생일</dt>
                  <dd className="mt-1">
                    {employee.birthday ? new Date(employee.birthday).toLocaleDateString('ko-KR') : '-'}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">등록일</dt>
                  <dd className="mt-1">
                    {employee.createdAt ? new Date(employee.createdAt).toLocaleDateString('ko-KR') : '-'}
                    {employee.createdBy && ` (${employee.createdBy.name})`}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">최종 수정일</dt>
                  <dd className="mt-1">
                    {employee.updatedAt ? new Date(employee.updatedAt).toLocaleDateString('ko-KR') : '-'}
                    {employee.updatedBy && ` (${employee.updatedBy.name})`}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 계정 탭 (ADMIN만) */}
        {userRole === 'ADMIN' && (
          <TabsContent value="account">
            <EmployeeAccountTab employeeId={employeeId} account={employee.account} />
          </TabsContent>
        )}

        {/* 이력 탭 (ADMIN만) */}
        {userRole === 'ADMIN' && (
          <TabsContent value="history">
            <EmployeeHistoryTab employeeId={employeeId} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
