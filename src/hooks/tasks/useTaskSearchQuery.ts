// Generated: 2026-01-25 03:30:00 KST

'use client';

import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { TaskSearchParams, TaskSearchResponse } from '@/types/task-search';
import { taskSearchKeys } from './queryKeys';

async function fetchTaskSearch(params: TaskSearchParams): Promise<TaskSearchResponse> {
  const searchParams = new URLSearchParams();

  searchParams.set('date_from', params.date_from);
  searchParams.set('date_to', params.date_to);
  searchParams.set('page', String(params.page ?? 1));
  searchParams.set('page_size', String(params.page_size ?? 20));
  searchParams.set('sort_by', params.sort_by ?? 'task_date');
  searchParams.set('sort_order', params.sort_order ?? 'DESC');

  if (params.type) searchParams.set('type', params.type);
  if (params.work_type) searchParams.set('work_type', params.work_type);
  if (params.status) searchParams.set('status', params.status);
  if (params.keyword && params.keyword.length >= 2) {
    searchParams.set('keyword', params.keyword);
  }
  if (params.employee_id) searchParams.set('employee_id', String(params.employee_id));
  if (params.customer_id) searchParams.set('customer_id', String(params.customer_id));

  const res = await fetch(`/sunjin/api/tasks?${searchParams.toString()}`);
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.error || 'Failed to fetch tasks');
  }
  return res.json();
}

export function useTaskSearchQuery(params: TaskSearchParams) {
  return useQuery({
    queryKey: taskSearchKeys.list(params),
    queryFn: () => fetchTaskSearch(params),
    staleTime: 30_000,
    enabled: !!params.date_from && !!params.date_to,
    placeholderData: keepPreviousData,
  });
}
