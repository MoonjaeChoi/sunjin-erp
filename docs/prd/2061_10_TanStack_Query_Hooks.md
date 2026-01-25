<!-- Generated: 2026-01-25 18:05:00 KST -->

# TanStack Query Hooks

**문서 번호**: 2061_10
**원본 PRD**: 2061_장애_현황_관리_prd_v2.md ('5.4 State Management')
**구현 범위**: Query Hooks (useIssueListQuery, useIssueDetailQuery, useIssueSummaryQuery) 및 Mutation Hooks
**복잡도**: M (Medium)
**의존성**: 2061_09 (TypeScript 타입)

---

## 구현 목표

TanStack Query를 이용한 서버 상태 관리 hooks를 구현한다:
- **Query Hooks**: 데이터 조회 (캐싱 포함)
- **Mutation Hooks**: 데이터 생성/수정/삭제
- **Query Key Factory**: 일관된 캐시 키 관리

---

## 구현 내용

### 파일 구조

생성할 파일:
```
src/hooks/issues.ts  # 모든 Issue 관련 hooks
```

### 구현 상세

```typescript
// Generated: 2026-01-25 18:05:00 KST
// src/hooks/issues.ts

import { useQuery, useMutation, useQueryClient, UseQueryResult } from '@tanstack/react-query';
import { useState } from 'react';
import {
  Issue,
  IssueListResponse,
  IssueDetailResponse,
  IssueSummaryResponse,
  CreateIssueRequest,
  UpdateIssueRequest,
  IssueListQueryParams,
  IssueSummaryQueryParams,
} from '@/types/issue';

/**
 * Query Key Factory
 */
export const issueKeys = {
  all: ['issues'] as const,
  lists: () => [...issueKeys.all, 'list'] as const,
  list: (params: IssueListQueryParams) => [...issueKeys.lists(), params] as const,
  details: () => [...issueKeys.all, 'detail'] as const,
  detail: (id: number) => [...issueKeys.details(), id] as const,
  summary: () => [...issueKeys.all, 'summary'] as const,
  summaryWithParams: (params: IssueSummaryQueryParams) => [...issueKeys.summary(), params] as const,
  attachments: () => [...issueKeys.all, 'attachments'] as const,
  attachment: (id: number) => [...issueKeys.attachments(), id] as const,
};

/**
 * API Utility Functions
 */

async function fetchIssueList(params: IssueListQueryParams): Promise<IssueListResponse> {
  const queryString = new URLSearchParams();
  if (params.page) queryString.append('page', params.page.toString());
  if (params.page_size) queryString.append('page_size', params.page_size.toString());
  if (params.customer_id) queryString.append('customer_id', params.customer_id.toString());
  if (params.status) queryString.append('status', params.status);
  if (params.severity) queryString.append('severity', params.severity);
  if (params.assignee_id) queryString.append('assignee_id', params.assignee_id.toString());
  if (params.created_by_id) queryString.append('created_by_id', params.created_by_id.toString());
  if (params.date_from) queryString.append('date_from', params.date_from);
  if (params.date_to) queryString.append('date_to', params.date_to);
  if (params.keyword) queryString.append('keyword', params.keyword);
  if (params.sort_by) queryString.append('sort_by', params.sort_by);
  if (params.sort_order) queryString.append('sort_order', params.sort_order);

  const response = await fetch(`/api/issues?${queryString}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch issue list: ${response.statusText}`);
  }

  return response.json();
}

async function fetchIssueDetail(id: number): Promise<IssueDetailResponse> {
  const response = await fetch(`/api/issues/${id}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch issue detail: ${response.statusText}`);
  }

  return response.json();
}

async function fetchIssueSummary(params?: IssueSummaryQueryParams): Promise<IssueSummaryResponse> {
  const queryString = new URLSearchParams();
  if (params?.customer_id) queryString.append('customer_id', params.customer_id.toString());
  if (params?.severity) queryString.append('severity', params.severity);

  const response = await fetch(`/api/issues/summary?${queryString}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch issue summary: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Query Hooks
 */

export function useIssueListQuery(params: IssueListQueryParams, options?: any) {
  return useQuery({
    queryKey: issueKeys.list(params),
    queryFn: () => fetchIssueList(params),
    staleTime: 1000 * 60 * 5, // 5분
    gcTime: 1000 * 60 * 30, // 30분
    ...options,
  });
}

export function useIssueDetailQuery(id: number, options?: any): UseQueryResult<IssueDetailResponse, Error> {
  return useQuery({
    queryKey: issueKeys.detail(id),
    queryFn: () => fetchIssueDetail(id),
    staleTime: 1000 * 60 * 5, // 5분
    gcTime: 1000 * 60 * 30, // 30분
    enabled: !!id,
    ...options,
  });
}

export function useIssueSummaryQuery(params?: IssueSummaryQueryParams, options?: any) {
  return useQuery({
    queryKey: issueKeys.summaryWithParams(params || {}),
    queryFn: () => fetchIssueSummary(params),
    staleTime: 1000 * 60 * 2, // 2분 (자주 변함)
    gcTime: 1000 * 60 * 30, // 30분
    ...options,
  });
}

/**
 * Mutation Hooks
 */

export function useCreateIssueMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateIssueRequest) => {
      const response = await fetch('/api/issues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`Failed to create issue: ${response.statusText}`);
      }

      return response.json();
    },
    onSuccess: () => {
      // 목록과 요약 캐시 무효화
      queryClient.invalidateQueries({ queryKey: issueKeys.lists() });
      queryClient.invalidateQueries({ queryKey: issueKeys.summary() });
    },
  });
}

export function useUpdateIssueMutation(id: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateIssueRequest) => {
      const response = await fetch(`/api/issues/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`Failed to update issue: ${response.statusText}`);
      }

      return response.json();
    },
    onSuccess: () => {
      // 해당 Issue 상세와 목록, 요약 캐시 무효화
      queryClient.invalidateQueries({ queryKey: issueKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: issueKeys.lists() });
      queryClient.invalidateQueries({ queryKey: issueKeys.summary() });
    },
  });
}

export function useDeleteIssueMutation(id: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/issues/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`Failed to delete issue: ${response.statusText}`);
      }

      return response.json();
    },
    onSuccess: () => {
      // 해당 Issue 상세와 목록, 요약 캐시 무효화
      queryClient.removeQueries({ queryKey: issueKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: issueKeys.lists() });
      queryClient.invalidateQueries({ queryKey: issueKeys.summary() });
    },
  });
}

export function useRollbackIssueMutation(id: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/issues/${id}/rollback`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error(`Failed to rollback issue: ${response.statusText}`);
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: issueKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: issueKeys.lists() });
      queryClient.invalidateQueries({ queryKey: issueKeys.summary() });
    },
  });
}

export function useUploadAttachmentMutation(id: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`/api/issues/${id}/attachments`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Failed to upload attachment: ${response.statusText}`);
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: issueKeys.detail(id) });
    },
  });
}

export function useDeleteAttachmentMutation(id: number, attachmentId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/issues/${id}/attachments/${attachmentId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`Failed to delete attachment: ${response.statusText}`);
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: issueKeys.detail(id) });
    },
  });
}

/**
 * Hook Composition Examples
 */

// 목록 + 요약 조회 (동시)
export function useIssueListWithSummary(params: IssueListQueryParams, summaryParams?: IssueSummaryQueryParams) {
  const listQuery = useIssueListQuery(params);
  const summaryQuery = useIssueSummaryQuery(summaryParams);

  return {
    list: listQuery,
    summary: summaryQuery,
    isLoading: listQuery.isLoading || summaryQuery.isLoading,
    isError: listQuery.isError || summaryQuery.isError,
  };
}
```

---

## 핵심 포인트

### Query Key Factory 패턴

```typescript
// 계층적 캐시 키 생성
issueKeys.all              // ['issues']
issueKeys.lists()          // ['issues', 'list']
issueKeys.list(params)     // ['issues', 'list', {...params}]
issueKeys.detail(id)       // ['issues', 'detail', id]

// 캐시 무효화 예시
queryClient.invalidateQueries({ queryKey: issueKeys.lists() }) // 모든 목록 무효화
queryClient.invalidateQueries({ queryKey: issueKeys.detail(id) }) // 특정 상세만 무효화
```

### 캐시 시간 설정

| 훅 | staleTime | gcTime |
|----|-----------| -------|
| useIssueListQuery | 5분 | 30분 |
| useIssueDetailQuery | 5분 | 30분 |
| useIssueSummaryQuery | 2분 | 30분 |

(요약은 자주 변하므로 더 짧은 staleTime)

---

## Acceptance Criteria

- [ ] useIssueListQuery 구현
- [ ] useIssueDetailQuery 구현
- [ ] useIssueSummaryQuery 구현
- [ ] useCreateIssueMutation 구현
- [ ] useUpdateIssueMutation 구현
- [ ] useDeleteIssueMutation 구현
- [ ] useRollbackIssueMutation 구현
- [ ] useUploadAttachmentMutation 구현
- [ ] useDeleteAttachmentMutation 구현
- [ ] Query Key Factory 패턴 적용
- [ ] 캐시 무효화 전략 적용
- [ ] TypeScript 빌드 성공
- [ ] ESLint 통과

---

## 완료 체크리스트

- [ ] src/hooks/issues.ts 생성
- [ ] 모든 Query Hooks 구현
- [ ] 모든 Mutation Hooks 구현
- [ ] Query Key Factory 정의
- [ ] 캐시 무효화 로직 구현
- [ ] API 호출 함수 구현
- [ ] 타입 안전성 검증
- [ ] TypeScript 빌드 성공
- [ ] ESLint 통과

---

**다음 문서**: 2061_11_Zustand_Store_정의.md
