// Generated: 2026-01-27 01:00:00 KST

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useMaintenanceContractList } from '@/hooks/useMaintenanceContracts';
import type { ContractFilters } from '@/types/maintenance';

/**
 * 유지보수 계약 목록 페이지 (Client Component)
 * - 계약 목록 조회 및 필터링
 * - 페이지네이션
 * - 정렬
 * - 신규 등록 버튼
 */
export default function MaintenanceListPageClient() {
  const [filters, setFilters] = useState<ContractFilters>({});
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  // 계약 목록 조회
  const { data: listResponse, isLoading, error } = useMaintenanceContractList(
    filters,
    page,
    limit
  );

  const contracts = listResponse?.data || [];
  const pagination = listResponse?.pagination;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">유지보수 계약</h1>
          <p className="mt-1 text-sm text-gray-500">
            고객사 유지보수 계약을 관리하고 추적합니다.
          </p>
        </div>
        <Link href="/maintenance/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            신규 계약 등록
          </Button>
        </Link>
      </div>

      {/* Filters Section - Placeholder for 2071_15 */}
      <div className="rounded-lg border bg-white p-4">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">필터</h2>
        <p className="text-xs text-gray-400">
          필터 컴포넌트는 2071_15에서 구현됩니다.
        </p>
      </div>

      {/* List Section - Placeholder for 2071_15 */}
      <div className="rounded-lg border bg-white">
        {isLoading && (
          <div className="p-8 text-center">
            <p className="text-sm text-gray-500">로딩 중...</p>
          </div>
        )}

        {error && (
          <div className="p-8 text-center">
            <p className="text-sm text-red-500">오류가 발생했습니다: {error.message}</p>
          </div>
        )}

        {!isLoading && !error && contracts.length === 0 && (
          <div className="p-8 text-center">
            <p className="text-sm text-gray-500">계약이 없습니다.</p>
          </div>
        )}

        {!isLoading && !error && contracts.length > 0 && (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      계약명
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      고객사
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      상태
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      만료일
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      담당자
                    </th>
                    <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">
                      작업
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {contracts.map((contract) => (
                    <tr key={contract.id} className="border-b hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <Link
                          href={`/maintenance/${contract.id}`}
                          className="text-sm font-medium text-blue-600 hover:underline"
                        >
                          {contract.contract_name}
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {contract.customer?.name || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${
                            contract.contract_status === '활성'
                              ? 'bg-green-100 text-green-800'
                              : contract.contract_status === '종료'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {contract.contract_status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {contract.end_date
                          ? new Date(contract.end_date).toLocaleDateString('ko-KR')
                          : '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {contract.assignedEmployee?.name || '-'}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <Link
                          href={`/maintenance/${contract.id}`}
                          className="text-sm text-blue-600 hover:underline"
                        >
                          상세보기
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination - Placeholder */}
            {pagination && (
              <div className="flex items-center justify-between border-t px-6 py-4">
                <p className="text-sm text-gray-500">
                  총 {pagination.total}개 ({pagination.page} / {pagination.totalPages}
                  )
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === 1}
                    onClick={() => setPage(Math.max(1, page - 1))}
                  >
                    이전
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= pagination.totalPages}
                    onClick={() => setPage(page + 1)}
                  >
                    다음
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
