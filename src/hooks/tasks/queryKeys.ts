// Generated: 2026-01-25 03:30:00 KST

import { TaskSearchParams } from '@/types/task-search';

export const taskSearchKeys = {
  all: ['tasks', 'search'] as const,
  list: (params: TaskSearchParams) => ['tasks', 'search', params] as const,
  detail: (id: number) => ['tasks', 'detail', id] as const,
};
