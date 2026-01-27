// Generated: 2026-01-28 00:30:00 KST

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useEmployees, useDepartments, usePositions } from '@/hooks/useEmployees';
import { EmployeeListQueryParams, UserRole } from '@/types/employee';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, ChevronLeft, ChevronRight } from 'lucide-react';

interface EmployeeListProps {
  userRole: UserRole;
  userDepartmentId?: number;
}

export function EmployeeList({ userRole, userDepartmentId }: EmployeeListProps) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [departmentId, setDepartmentId] = useState<string>(
    userRole === 'MANAGER' && userDepartmentId ? userDepartmentId.toString() : 'ALL'
  );
  const [positionId, setPositionId] = useState<string>('ALL');
  const [isActive, setIsActive] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'name' | 'hiredAt' | 'department'>('name');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('ASC');

  const { data: departments } = useDepartments();
  const { data: positions } = usePositions();

  const params: EmployeeListQueryParams = {
    page,
    limit: 20,
    search: search || undefined,
    departmentId: departmentId !== 'ALL' ? parseInt(departmentId, 10) : undefined,
    positionId: positionId !== 'ALL' ? parseInt(positionId, 10) : undefined,
    isActive: isActive !== 'ALL' ? isActive === 'true' : undefined,
    sortBy,
    sortOrder,
  };

  const { data, isLoading, error } = useEmployees(params);

  // 부서 목록 평탄화 (계층 구조에서 flat list로)
  const flattenDepartments = (depts: typeof departments, level = 0): { id: number; name: string; level: number }[] => {
    if (!depts) return [];
    return depts.flatMap(dept => [
      { id: dept.id, name: dept.name, level },
      ...flattenDepartments(dept.children, level + 1),
    ]);
  };
  const flatDepartments = flattenDepartments(departments);

  if (error) {
    return <div className="text-red-600 p-4 border border-red-300 rounded-lg">오류: {error.message}</div>;
  }

  const employees = data?.data || [];
  const pagination = data?.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 };

  return (
    <div className="space-y-4">
      {/* 필터 영역 */}
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:flex-wrap">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium mb-1">검색</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="이름 또는 이메일 검색..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-10"
            />
          </div>
        </div>

        {/* ADMIN만 부서 필터 표시 */}
        {userRole === 'ADMIN' && (
          <div className="w-full md:w-48">
            <label className="block text-sm font-medium mb-1">부서</label>
            <Select value={departmentId} onValueChange={(v) => { setDepartmentId(v); setPage(1); }}>
              <SelectTrigger>
                <SelectValue placeholder="부서 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">전체</SelectItem>
                {flatDepartments.map((dept) => (
                  <SelectItem key={dept.id} value={dept.id.toString()}>
                    {'　'.repeat(dept.level)}{dept.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="w-full md:w-40">
          <label className="block text-sm font-medium mb-1">직급</label>
          <Select value={positionId} onValueChange={(v) => { setPositionId(v); setPage(1); }}>
            <SelectTrigger>
              <SelectValue placeholder="직급 선택" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">전체</SelectItem>
              {(positions || []).map((pos) => (
                <SelectItem key={pos.id} value={pos.id.toString()}>
                  {pos.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* ADMIN만 활성 상태 필터 표시 */}
        {userRole === 'ADMIN' && (
          <div className="w-full md:w-36">
            <label className="block text-sm font-medium mb-1">계정 상태</label>
            <Select value={isActive} onValueChange={(v) => { setIsActive(v); setPage(1); }}>
              <SelectTrigger>
                <SelectValue placeholder="상태 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">전체</SelectItem>
                <SelectItem value="true">활성</SelectItem>
                <SelectItem value="false">비활성</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* ADMIN만 신규 등록 버튼 표시 */}
        {userRole === 'ADMIN' && (
          <Link href="/employees/new">
            <Button className="gap-2 w-full md:w-auto">
              <Plus className="h-4 w-4" />
              신규 등록
            </Button>
          </Link>
        )}
      </div>

      {/* 직원 테이블 */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium">이름</th>
                <th className="px-4 py-3 text-left text-sm font-medium">부서</th>
                <th className="px-4 py-3 text-left text-sm font-medium">직급</th>
                <th className="hidden md:table-cell px-4 py-3 text-left text-sm font-medium">이메일</th>
                <th className="hidden lg:table-cell px-4 py-3 text-left text-sm font-medium">입사일</th>
                {userRole === 'ADMIN' && (
                  <th className="px-4 py-3 text-center text-sm font-medium">상태</th>
                )}
                <th className="px-4 py-3 text-center text-sm font-medium">작업</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={userRole === 'ADMIN' ? 7 : 6} className="px-4 py-8 text-center text-gray-500">
                    로딩 중...
                  </td>
                </tr>
              ) : employees.length === 0 ? (
                <tr>
                  <td colSpan={userRole === 'ADMIN' ? 7 : 6} className="px-4 py-8 text-center text-gray-500">
                    직원이 없습니다.
                  </td>
                </tr>
              ) : (
                employees.map((employee) => (
                  <tr key={employee.id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium">{employee.name}</td>
                    <td className="px-4 py-3 text-sm">{employee.departmentName}</td>
                    <td className="px-4 py-3 text-sm">{employee.positionName}</td>
                    <td className="hidden md:table-cell px-4 py-3 text-sm text-gray-600">{employee.email}</td>
                    <td className="hidden lg:table-cell px-4 py-3 text-sm text-gray-600">
                      {employee.hiredAt ? new Date(employee.hiredAt).toLocaleDateString('ko-KR') : '-'}
                    </td>
                    {userRole === 'ADMIN' && (
                      <td className="px-4 py-3 text-center">
                        <Badge className={employee.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}>
                          {employee.isActive ? '활성' : '비활성'}
                        </Badge>
                      </td>
                    )}
                    <td className="px-4 py-3 text-center">
                      <Link href={`/employees/${employee.id}`}>
                        <Button variant="ghost" size="sm">상세</Button>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* 페이지네이션 */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">
            총 {pagination.total}명 ({pagination.page}/{pagination.totalPages} 페이지)
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page - 1)}
              disabled={page <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
              이전
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(page + 1)}
              disabled={page >= pagination.totalPages}
            >
              다음
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
