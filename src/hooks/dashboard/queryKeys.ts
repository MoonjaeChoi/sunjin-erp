// Generated: 2026-01-24 23:30:00 KST

import { TaskFilters } from '@/types/dashboard';

export const taskKeys = {
  all: ['tasks'] as const,
  lists: () => [...taskKeys.all, 'list'] as const,
  list: (filters: TaskFilters) => [...taskKeys.lists(), filters] as const,
  details: () => [...taskKeys.all, 'detail'] as const,
  detail: (id: number) => [...taskKeys.details(), id] as const,
  dailySummary: (date: string) => ['dashboard', 'daily-summary', date] as const,
  team: (dateFrom: string, dateTo: string) =>
    ['dashboard', 'team', dateFrom, dateTo] as const,
};
