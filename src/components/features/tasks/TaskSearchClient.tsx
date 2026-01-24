// Generated: 2026-01-25 03:45:00 KST

'use client';

import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useCallback, useMemo } from 'react';
import { useTaskSearchQuery } from '@/hooks/tasks';
import {
  TaskSearchParams,
  DEFAULT_PAGE_SIZE,
  DEFAULT_SORT_BY,
  DEFAULT_SORT_ORDER,
} from '@/types/task-search';
import { TaskSearchFilters } from './TaskSearchFilters';
import { TaskDataTable } from './TaskDataTable';
import { TaskDetailDialog } from './TaskDetailDialog';

function getDefaultDateRange() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const firstDay = `${year}-${String(month + 1).padStart(2, '0')}-01`;
  const lastDay = new Date(year, month + 1, 0).getDate();
  const lastDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
  return { firstDay, lastDate };
}

export function TaskSearchClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  // URL params → TaskSearchParams 파싱
  const params: TaskSearchParams = useMemo(() => {
    const { firstDay, lastDate } = getDefaultDateRange();

    return {
      date_from: searchParams.get('date_from') || firstDay,
      date_to: searchParams.get('date_to') || lastDate,
      type: (searchParams.get('type') as TaskSearchParams['type']) || undefined,
      work_type: (searchParams.get('work_type') as TaskSearchParams['work_type']) || undefined,
      status: (searchParams.get('status') as TaskSearchParams['status']) || undefined,
      keyword: searchParams.get('keyword') || undefined,
      page: Number(searchParams.get('page')) || 1,
      page_size: (Number(searchParams.get('page_size')) || DEFAULT_PAGE_SIZE) as TaskSearchParams['page_size'],
      sort_by: (searchParams.get('sort_by') as TaskSearchParams['sort_by']) || DEFAULT_SORT_BY,
      sort_order: (searchParams.get('sort_order') as TaskSearchParams['sort_order']) || DEFAULT_SORT_ORDER,
    };
  }, [searchParams]);

  // URL 업데이트 함수
  const updateURL = useCallback(
    (updates: Partial<TaskSearchParams & { detail?: number }>) => {
      const newParams = new URLSearchParams(searchParams.toString());
      const { firstDay, lastDate } = getDefaultDateRange();

      // 필터 변경 시 page 리셋 (page 자체 변경이 아닌 경우)
      const isPageChange = 'page' in updates && Object.keys(updates).length === 1;
      if (!isPageChange && !('page' in updates)) {
        newParams.set('page', '1');
      }

      for (const [key, value] of Object.entries(updates)) {
        if (value === undefined || value === '' || value === null) {
          newParams.delete(key);
        } else {
          newParams.set(key, String(value));
        }
      }

      // 기본값은 URL에서 제거
      if (newParams.get('page') === '1') newParams.delete('page');
      if (newParams.get('page_size') === String(DEFAULT_PAGE_SIZE)) newParams.delete('page_size');
      if (newParams.get('sort_by') === DEFAULT_SORT_BY) newParams.delete('sort_by');
      if (newParams.get('sort_order') === DEFAULT_SORT_ORDER) newParams.delete('sort_order');
      if (newParams.get('date_from') === firstDay) newParams.delete('date_from');
      if (newParams.get('date_to') === lastDate) newParams.delete('date_to');

      const queryString = newParams.toString();
      router.replace(`${pathname}${queryString ? `?${queryString}` : ''}`, { scroll: false });
    },
    [searchParams, router, pathname]
  );

  // Dialog 상태
  const detailId = searchParams.get('detail') ? Number(searchParams.get('detail')) : null;

  const handleCloseDetail = useCallback(() => {
    const newParams = new URLSearchParams(searchParams.toString());
    newParams.delete('detail');
    const queryString = newParams.toString();
    router.replace(`${pathname}${queryString ? `?${queryString}` : ''}`, { scroll: false });
  }, [searchParams, router, pathname]);

  // TanStack Query
  const { data, isLoading, isPlaceholderData } = useTaskSearchQuery(params);

  return (
    <div className="space-y-4">
      {/* 필터 */}
      <TaskSearchFilters params={params} onUpdate={updateURL} />

      {/* 테이블 */}
      <TaskDataTable
        data={data}
        isLoading={isLoading}
        isPlaceholderData={isPlaceholderData}
        params={params}
        onUpdate={updateURL}
      />

      {/* 상세 Dialog */}
      <TaskDetailDialog taskId={detailId} onClose={handleCloseDetail} />
    </div>
  );
}
