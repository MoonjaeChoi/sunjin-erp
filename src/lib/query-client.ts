// Generated: 2026-01-24 21:20:00 KST

'use client';

import { QueryClient } from '@tanstack/react-query';

/**
 * TanStack Query 글로벌 설정
 *
 * PRD Section 5.4 참조:
 * - 401 응답 시 재시도 안 함
 * - mutation 에러 시 401이면 로그인 리다이렉트
 */
export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: (failureCount, error: any) => {
          if (error?.status === 401) return false;
          return failureCount < 3;
        },
        staleTime: 5 * 60 * 1000, // 5분
      },
      mutations: {
        onError: (error: any) => {
          if (error?.status === 401) {
            window.location.href = '/login';
          }
        },
      },
    },
  });
}
