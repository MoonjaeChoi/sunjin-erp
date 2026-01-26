'use client';

// Generated: 2026-01-26 15:05:00 KST

import { useState } from 'react';
import { useInventoryListQuery, useInventoryStatsQuery } from '@/hooks/inventory';
import { useInventoryFilterStore } from '@/stores/inventoryFilterStore';
import InventoryFilters from '@/components/features/inventory/InventoryFilters';
import InventoryDataTable from '@/components/features/inventory/InventoryDataTable';
import InventoryStats from '@/components/features/inventory/InventoryStats';
import InventoryDetailDialog from '@/components/features/inventory/InventoryDetailDialog';
import CreateInventoryForm from '@/components/features/inventory/CreateInventoryForm';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';

export default function InventoryListPageClient() {
  // 입고 다이얼로그 상태
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Store에서 필터, 페이지네이션, 정렬 가져오기
  const filters = useInventoryFilterStore((state) => state.filters);
  const pagination = useInventoryFilterStore((state) => state.pagination);
  const sort = useInventoryFilterStore((state) => state.sort);
  const isDetailOpen = useInventoryFilterStore((state) => state.isDetailOpen);
  const selectedInventoryId = useInventoryFilterStore((state) => state.selectedInventoryId);

  // 쿼리 파라미터 조합
  const queryParams = {
    page: pagination.page,
    pageSize: pagination.pageSize,
    categories: filters.categories,
    statuses: filters.statuses,
    location: filters.location,
    search: filters.search,
    sortBy: sort.sortBy,
    order: sort.order,
  };

  // 목록과 통계 조회
  const listQuery = useInventoryListQuery(queryParams);
  const statsQuery = useInventoryStatsQuery();

  const isLoading = listQuery.isLoading || statsQuery.isLoading;
  const isError = listQuery.isError || statsQuery.isError;

  if (isLoading) return <InventoryListSkeleton />;
  if (isError) return <div className="p-4 text-red-600">오류가 발생했습니다.</div>;

  const listData = (listQuery.data as any) || { data: [], pagination: {} };
  const statsData = (statsQuery.data as any) || { totalCount: 0, byStatus: {}, byCategory: {}, overdue: { count: 0, percentage: 0 } };

  return (
    <div className="space-y-4 p-4">
      {/* 헤더 */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">재고 관리</h1>
        <Button onClick={() => setIsCreateOpen(true)}>신규 등록</Button>
      </div>

      {/* 필터 */}
      <InventoryFilters />

      {/* 통계 */}
      {statsData && <InventoryStats stats={statsData} />}

      {/* 목록 테이블 */}
      {listData && (
        <InventoryDataTable
          data={listData.data}
          pagination={listData.pagination}
        />
      )}

      {/* 상세보기 다이얼로그 */}
      <InventoryDetailDialog />

      {/* 입고 다이얼로그 */}
      <CreateInventoryForm open={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
    </div>
  );
}

function InventoryListSkeleton() {
  return (
    <div className="space-y-4 p-4">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-96 w-full" />
    </div>
  );
}
