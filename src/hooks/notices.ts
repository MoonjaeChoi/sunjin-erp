// Generated: 2026-01-28 16:00:00 KST

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  NoticeListResponse,
  NoticeListParams,
  NoticeDetail,
  CommentListResponse,
  NoticeStatisticsResponse,
  CreateNoticeRequest,
  UpdateNoticeRequest,
  CreateCommentRequest,
  UpdateCommentRequest,
} from '@/types/notice';

/**
 * Query Key Factory
 */
export const noticeKeys = {
  all: () => ['notices'] as const,
  lists: () => [...noticeKeys.all(), 'list'] as const,
  list: (params: NoticeListParams) => [...noticeKeys.lists(), params] as const,
  details: () => [...noticeKeys.all(), 'detail'] as const,
  detail: (id: number) => [...noticeKeys.details(), id] as const,
  comments: (noticeId: number) => [...noticeKeys.all(), 'comments', noticeId] as const,
  stats: () => [...noticeKeys.all(), 'stats'] as const,
};

/**
 * API Utility Functions
 */

async function fetchNoticeList(params: NoticeListParams): Promise<NoticeListResponse> {
  const queryString = new URLSearchParams();

  if (params.page) queryString.append('page', params.page.toString());
  if (params.limit) queryString.append('limit', params.limit.toString());
  if (params.type && params.type !== 'all') queryString.append('type', params.type);
  if (params.search) queryString.append('search', params.search);
  if (params.sortBy) queryString.append('sortBy', params.sortBy);
  if (params.startDate) queryString.append('startDate', params.startDate);
  if (params.endDate) queryString.append('endDate', params.endDate);
  if (params.authorId) queryString.append('authorId', params.authorId.toString());

  const response = await fetch(`/sunjin/api/notices?${queryString}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || '게시물 목록을 불러오는데 실패했습니다');
  }

  return response.json();
}

async function fetchNoticeDetail(id: number): Promise<{ data: NoticeDetail }> {
  const response = await fetch(`/sunjin/api/notices/${id}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || '게시물을 불러오는데 실패했습니다');
  }

  return response.json();
}

async function fetchComments(noticeId: number): Promise<CommentListResponse> {
  const response = await fetch(`/sunjin/api/notices/${noticeId}/comments`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || '댓글을 불러오는데 실패했습니다');
  }

  return response.json();
}

async function fetchNoticeStats(params?: { startDate?: string; endDate?: string }): Promise<NoticeStatisticsResponse> {
  const queryString = new URLSearchParams();
  if (params?.startDate) queryString.append('startDate', params.startDate);
  if (params?.endDate) queryString.append('endDate', params.endDate);

  const response = await fetch(`/sunjin/api/notices/stats?${queryString}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || '통계를 불러오는데 실패했습니다');
  }

  return response.json();
}

/**
 * Query Hooks
 */

export function useNotices(params: NoticeListParams) {
  return useQuery({
    queryKey: noticeKeys.list(params),
    queryFn: () => fetchNoticeList(params),
    staleTime: 1000 * 60 * 5, // 5분
    gcTime: 1000 * 60 * 30, // 30분
  });
}

export function useNotice(id: number) {
  return useQuery({
    queryKey: noticeKeys.detail(id),
    queryFn: () => fetchNoticeDetail(id),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    enabled: !!id,
  });
}

export function useComments(noticeId: number) {
  return useQuery({
    queryKey: noticeKeys.comments(noticeId),
    queryFn: () => fetchComments(noticeId),
    staleTime: 1000 * 60 * 2, // 2분 (댓글은 자주 변함)
    gcTime: 1000 * 60 * 30,
    enabled: !!noticeId,
  });
}

export function useNoticeStats(params?: { startDate?: string; endDate?: string }) {
  return useQuery({
    queryKey: noticeKeys.stats(),
    queryFn: () => fetchNoticeStats(params),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  });
}

/**
 * Mutation Hooks
 */

export function useCreateNotice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData: FormData) => {
      const response = await fetch('/sunjin/api/notices', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || '게시물 등록에 실패했습니다');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: noticeKeys.lists() });
      queryClient.invalidateQueries({ queryKey: noticeKeys.stats() });
    },
  });
}

export function useUpdateNotice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdateNoticeRequest }) => {
      const response = await fetch(`/sunjin/api/notices/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || '게시물 수정에 실패했습니다');
      }

      return response.json();
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: noticeKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: noticeKeys.lists() });
    },
  });
}

export function useDeleteNotice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, reason }: { id: number; reason?: string }) => {
      const response = await fetch(`/sunjin/api/notices/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || '게시물 삭제에 실패했습니다');
      }

      return response.json();
    },
    onSuccess: (_, { id }) => {
      queryClient.removeQueries({ queryKey: noticeKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: noticeKeys.lists() });
      queryClient.invalidateQueries({ queryKey: noticeKeys.stats() });
    },
  });
}

export function useCreateComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ noticeId, data }: { noticeId: number; data: CreateCommentRequest }) => {
      const response = await fetch(`/sunjin/api/notices/${noticeId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || '댓글 등록에 실패했습니다');
      }

      return response.json();
    },
    onSuccess: (_, { noticeId }) => {
      queryClient.invalidateQueries({ queryKey: noticeKeys.comments(noticeId) });
      queryClient.invalidateQueries({ queryKey: noticeKeys.detail(noticeId) });
      queryClient.invalidateQueries({ queryKey: noticeKeys.lists() });
    },
  });
}

export function useUpdateComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      noticeId,
      commentId,
      data,
    }: {
      noticeId: number;
      commentId: number;
      data: UpdateCommentRequest;
    }) => {
      const response = await fetch(`/sunjin/api/notices/${noticeId}/comments/${commentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || '댓글 수정에 실패했습니다');
      }

      return response.json();
    },
    onSuccess: (_, { noticeId }) => {
      queryClient.invalidateQueries({ queryKey: noticeKeys.comments(noticeId) });
    },
  });
}

export function useDeleteComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ noticeId, commentId }: { noticeId: number; commentId: number }) => {
      const response = await fetch(`/sunjin/api/notices/${noticeId}/comments/${commentId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || '댓글 삭제에 실패했습니다');
      }

      return response.json();
    },
    onSuccess: (_, { noticeId }) => {
      queryClient.invalidateQueries({ queryKey: noticeKeys.comments(noticeId) });
      queryClient.invalidateQueries({ queryKey: noticeKeys.detail(noticeId) });
      queryClient.invalidateQueries({ queryKey: noticeKeys.lists() });
    },
  });
}

export function useDeleteAttachment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ noticeId, attachmentId }: { noticeId: number; attachmentId: number }) => {
      const response = await fetch(`/sunjin/api/notices/${noticeId}/attachments/${attachmentId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || '첨부파일 삭제에 실패했습니다');
      }

      return response.json();
    },
    onSuccess: (_, { noticeId }) => {
      queryClient.invalidateQueries({ queryKey: noticeKeys.detail(noticeId) });
    },
  });
}
