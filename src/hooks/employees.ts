// Generated: 2026-01-25 14:50:00 KST

'use client';

import { useQuery } from '@tanstack/react-query';
import { EmployeeListResponse } from '@/types/project';

/**
 * Employee 관련 Query Key Factory
 */
export const employeeKeys = {
  all: ['employees'] as const,
  list: () => [...employeeKeys.all, 'list'] as const,
};

/**
 * Employee 목록 조회 Hook
 * 프로젝트 담당자 선택에 사용
 *
 * @returns {UseQueryResult<EmployeeListResponse>} 직원 목록
 */
export function useEmployeeListQuery() {
  return useQuery({
    queryKey: employeeKeys.list(),
    queryFn: async (): Promise<EmployeeListResponse> => {
      const res = await fetch('/api/employees/list');
      if (!res.ok) {
        throw new Error('Failed to fetch employees');
      }
      return res.json();
    },
    staleTime: 5 * 60 * 1000, // 5분 (직원 목록은 자주 변경되지 않음)
  });
}
