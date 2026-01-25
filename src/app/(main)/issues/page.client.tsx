'use client';

// Generated: 2026-01-25 18:05:00 KST

import { useState } from 'react';
import { useIssueListWithSummary } from '@/hooks/issues';
import { useIssueFilterStore } from '@/stores/issueFilterStore';
import IssueFilters from '@/components/features/issues/IssueFilters';
import IssueSummaryBadges from '@/components/features/issues/IssueSummaryBadges';
import IssueDataTable from '@/components/features/issues/IssueDataTable';
import IssueCreateDialog from '@/components/features/issues/IssueCreateDialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';

export default function IssueListPageClient() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Store에서 필터와 페이지네이션 가져오기
  const filters = useIssueFilterStore((state) => state.filters);
  const pagination = useIssueFilterStore((state) => state.pagination);
  const sort = useIssueFilterStore((state) => state.sort);

  // 쿼리 파라미터 조합
  const queryParams = {
    ...pagination,
    ...filters,
    sort_by: sort.sort_by,
    sort_order: sort.sort_order,
  };

  // 목록 + 요약 조회
  const { list, summary, isLoading, isError } = useIssueListWithSummary(queryParams);

  if (isLoading) return <IssueListSkeleton />;
  if (isError) return <div>오류가 발생했습니다.</div>;

  return (
    <div className="space-y-4 p-4">
      {/* 헤더 */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">장애 현황</h1>
        <Button onClick={() => setIsCreateOpen(true)}>신규 등록</Button>
      </div>

      {/* 필터 */}
      <IssueFilters />

      {/* 요약 배지 */}
      {summary.data && <IssueSummaryBadges summary={summary.data} />}

      {/* 목록 테이블 */}
      {list.data && <IssueDataTable issues={list.data.data} pagination={list.data.pagination} />}

      {/* 신규 등록 다이얼로그 */}
      <IssueCreateDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} />
    </div>
  );
}

function IssueListSkeleton() {
  return (
    <div className="space-y-4 p-4">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-96 w-full" />
    </div>
  );
}
