// Generated: 2026-01-25 18:05:00 KST

import { useQuery, useMutation, useQueryClient, UseQueryResult } from '@tanstack/react-query';
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
  summaryWithParams: (params: IssueSummaryQueryParams) =>
    [...issueKeys.summary(), params] as const,
  attachments: () => [...issueKeys.all, 'attachments'] as const,
  attachment: (id: number) => [...issueKeys.attachments(), id] as const,
};

/**
 * API Utility Functions
 */

async function fetchIssueList(
  params: IssueListQueryParams
): Promise<IssueListResponse> {
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

async function fetchIssueSummary(
  params?: IssueSummaryQueryParams
): Promise<IssueSummaryResponse> {
  const queryString = new URLSearchParams();
  if (params?.customer_id)
    queryString.append('customer_id', params.customer_id.toString());
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
    staleTime: 1000 * 60 * 5, // 5分
    gcTime: 1000 * 60 * 30, // 30分
    ...options,
  });
}

export function useIssueDetailQuery(id: number, options?: any) {
  return useQuery({
    queryKey: issueKeys.detail(id),
    queryFn: () => fetchIssueDetail(id),
    staleTime: 1000 * 60 * 5, // 5分
    gcTime: 1000 * 60 * 30, // 30分
    enabled: !!id,
    ...options,
  });
}

export function useIssueSummaryQuery(
  params?: IssueSummaryQueryParams,
  options?: any
) {
  return useQuery({
    queryKey: issueKeys.summaryWithParams(params || {}),
    queryFn: () => fetchIssueSummary(params),
    staleTime: 1000 * 60 * 2, // 2分 (자주 변함)
    gcTime: 1000 * 60 * 30, // 30分
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
export function useIssueListWithSummary(
  params: IssueListQueryParams,
  summaryParams?: IssueSummaryQueryParams
) {
  const listQuery = useIssueListQuery(params);
  const summaryQuery = useIssueSummaryQuery(summaryParams);

  return {
    list: listQuery,
    summary: summaryQuery,
    isLoading: listQuery.isLoading || summaryQuery.isLoading,
    isError: listQuery.isError || summaryQuery.isError,
  };
}
