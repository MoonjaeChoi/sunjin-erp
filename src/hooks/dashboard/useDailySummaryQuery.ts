// Generated: 2026-01-24 23:30:00 KST

'use client';

import { useQuery } from '@tanstack/react-query';
import { DailySummaryResponse } from '@/types/dashboard';
import { taskKeys } from './queryKeys';

async function fetchDailySummary(date: string): Promise<DailySummaryResponse> {
  const res = await fetch(`/sunjin/api/dashboard/daily-summary?date=${encodeURIComponent(date)}`);
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw { status: res.status, ...error };
  }
  return res.json();
}

export function useDailySummaryQuery(date: string | null) {
  return useQuery({
    queryKey: taskKeys.dailySummary(date || ''),
    queryFn: () => fetchDailySummary(date!),
    staleTime: 30_000,
    enabled: !!date,
  });
}
