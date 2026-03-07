// Generated: 2026-01-25 03:30:00 KST

'use client';

import { useQuery } from '@tanstack/react-query';
import { TaskRecord } from '@/types/task-search';
import { taskSearchKeys } from './queryKeys';

async function fetchTaskDetail(id: number): Promise<TaskRecord> {
  const res = await fetch(`/sunjin/api/tasks/${id}`);
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.error || 'Failed to fetch task');
  }
  return res.json();
}

export function useTaskDetailQuery(id: number | null) {
  return useQuery({
    queryKey: taskSearchKeys.detail(id!),
    queryFn: () => fetchTaskDetail(id!),
    enabled: id !== null,
  });
}
