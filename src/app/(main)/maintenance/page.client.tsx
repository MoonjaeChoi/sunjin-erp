// Generated: 2026-01-27 01:30:00 KST

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useMaintenanceContractList, useMaintenanceContractStats } from '@/hooks/useMaintenanceContracts';
import MaintenanceContractTable from '@/components/features/maintenance/MaintenanceContractTable';
import MaintenanceContractFilters from '@/components/features/maintenance/MaintenanceContractFilters';
import MaintenanceContractStats from '@/components/features/maintenance/MaintenanceContractStats';
import type { ContractFilters } from '@/types/maintenance';

/**
 * 유지보수 계약 목록 페이지 (Client Component)
 * - 계약 통계 표시
 * - 계약 필터 패널
 * - 계약 목록 테이블
 * - 페이지네이션 및 정렬
 */
export default function MaintenanceListPageClient() {
  const [filters, setFilters] = useState<ContractFilters>({});
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [sortBy, setSortBy] = useState('');
  const [order, setOrder] = useState<'ASC' | 'DESC'>('ASC');

  // 계약 목록 조회
  const { data: listResponse, isLoading: listLoading, error } = useMaintenanceContractList(
    filters,
    page,
    limit,
    sortBy,
    order
  );

  // 계약 통계 조회
  const { data: statsResponse, isLoading: statsLoading } = useMaintenanceContractStats();

  const contracts = listResponse?.data || [];
  const pagination = listResponse?.pagination;
  const stats = statsResponse?.data || null;

  // 필터 적용
  const handleFilterChange = (newFilters: ContractFilters) => {
    setFilters(newFilters);
    setPage(1); // 필터 변경 시 첫 페이지로 리셋
  };

  // 정렬 처리
  const handleSort = (column: string, sortOrder: 'ASC' | 'DESC') => {
    setSortBy(column);
    setOrder(sortOrder);
    setPage(1);
  };

  // 페이지 변경
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  // 삭제 처리 (placeholder - 실제 구현은 2071_18에서)
  const handleDelete = (id: number) => {
    console.log('Delete contract:', id);
    // 실제 삭제는 mutation으로 구현됨
  };

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

      {/* Error Alert */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-700">
            오류가 발생했습니다: {error.message}
          </p>
        </div>
      )}

      {/* Statistics Section */}
      {/* <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">통계</h2>
        <MaintenanceContractStats stats={stats} isLoading={statsLoading} />
      </div> */}

      {/* Filters Section */}
      {/* <div>
        <MaintenanceContractFilters
          onFilterChange={handleFilterChange}
          onReset={() => {
            setFilters({});
            setPage(1);
          }}
        />
      </div> */}

      {/* Table Section */}
      {/* <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">계약 목록</h2>
        <MaintenanceContractTable
          contracts={contracts}
          pagination={pagination}
          sortBy={sortBy}
          order={order}
          isLoading={listLoading}
          onPageChange={handlePageChange}
          onSort={handleSort}
          onDelete={handleDelete}
        />
      </div> */}
      <div className="rounded-lg border bg-white p-8 text-center">
        <p className="text-sm text-gray-700">계약 목록 표시 중... ({contracts.length}개)</p>
      </div>
    </div>
  );
}
