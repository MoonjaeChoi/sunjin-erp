// Generated: 2026-01-24 23:30:00 KST

'use client';

import { useQuery } from '@tanstack/react-query';
import { TaskFilters, TaskListResponse } from '@/types/dashboard';
import { taskKeys } from './queryKeys';

async function fetchTasks(filters: TaskFilters): Promise<TaskListResponse> {
  const params = new URLSearchParams({
    date_from: filters.date_from,
    date_to: filters.date_to,
  });
  if (filters.employee_id) params.set('employee_id', String(filters.employee_id));
  if (filters.type) params.set('type', filters.type);
  if (filters.status) params.set('status', filters.status);

  const res = await fetch(`/api/tasks?${params.toString()}`);
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw { status: res.status, ...error };
  }
  return res.json();
}

export function useTasksQuery(filters: TaskFilters) {
  return useQuery({
    queryKey: taskKeys.list(filters),
    queryFn: () => fetchTasks(filters),
    staleTime: 30_000,
    enabled: !!filters.date_from && !!filters.date_to,
  });
}
