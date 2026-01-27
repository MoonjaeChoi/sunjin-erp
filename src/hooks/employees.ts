// Generated: 2026-01-28 00:20:00 KST

'use client';

import { useQuery } from '@tanstack/react-query';
import { EmployeeListResponse } from '@/types/project';

// Re-export all hooks from useEmployees.ts for the Employee Management module
export * from './useEmployees';

/**
 * Employee 관련 Query Key Factory (레거시 - dropdown용)
 * @deprecated Use employeeQueryKeys from useEmployees.ts for new code
 */
export const employeeKeys = {
  all: ['employees'] as const,
  list: () => [...employeeKeys.all, 'list'] as const,
  dropdown: () => [...employeeKeys.all, 'dropdown'] as const,
};

/**
 * Employee 목록 조회 Hook (드롭다운용 - 간단한 목록)
 * 프로젝트/기술지원 담당자 선택에 사용
 *
 * 참고: 직원 관리 모듈의 전체 기능은 useEmployees.ts의 hooks를 사용하세요.
 *
 * @returns {UseQueryResult<EmployeeListResponse>} 직원 목록 (드롭다운용)
 */
export function useEmployeeListQuery() {
  return useQuery({
    queryKey: employeeKeys.dropdown(),
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
