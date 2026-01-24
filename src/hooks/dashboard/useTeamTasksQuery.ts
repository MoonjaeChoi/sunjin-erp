// Generated: 2026-01-24 23:30:00 KST

'use client';

import { useQuery } from '@tanstack/react-query';
import { TeamCalendarResponse } from '@/types/dashboard';
import { taskKeys } from './queryKeys';

async function fetchTeamTasks(
  dateFrom: string,
  dateTo: string
): Promise<TeamCalendarResponse> {
  const params = new URLSearchParams({
    date_from: dateFrom,
    date_to: dateTo,
  });
  const res = await fetch(`/api/dashboard/team?${params.toString()}`);
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw { status: res.status, ...error };
  }
  return res.json();
}

export function useTeamTasksQuery(dateFrom: string, dateTo: string) {
  return useQuery({
    queryKey: taskKeys.team(dateFrom, dateTo),
    queryFn: () => fetchTeamTasks(dateFrom, dateTo),
    staleTime: 60_000,
    enabled: !!dateFrom && !!dateTo,
  });
}
