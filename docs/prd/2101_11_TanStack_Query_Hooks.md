<!-- Generated: 2026-01-28 15:30:00 KST -->

# TanStack Query Hooks

**문서 번호**: 2101_11
**원본 PRD**: 2101_공지사항_prd_v2.md
**PRD 참조**: 원본 PRD의 'Section 4.1 TanStack Query Hooks' 참조
**구현 범위**: useNotices, useNotice, useComments, mutations
**복잡도**: M (1~2일)
**의존성**: 2101_04~10 (API Routes)

---

## 구현 목표

공지사항 모듈의 TanStack Query 훅을 구현합니다.
- 데이터 조회 (useQuery)
- 데이터 변경 (useMutation)
- 캐시 무효화 전략

---

## 구현 내용

### 파일 구조

```
src/hooks/notices/
├── useNotices.ts
├── useNotice.ts
├── useNoticesMutations.ts
├── useComments.ts
├── useCommentsMutations.ts
├── useNoticeStatistics.ts
└── index.ts
```

### useNotices.ts - 목록 조회

```typescript
// Generated: 2026-01-28 15:30:00 KST

import { useQuery, keepPreviousData } from '@tanstack/react-query';
import type { NoticeListParams, NoticeListResponse } from '@/types/notice';

const NOTICES_QUERY_KEY = 'notices-list';

async function fetchNotices(params: NoticeListParams): Promise<NoticeListResponse> {
  const searchParams = new URLSearchParams();

  if (params.page) searchParams.set('page', String(params.page));
  if (params.limit) searchParams.set('limit', String(params.limit));
  if (params.type && params.type !== 'all') searchParams.set('type', params.type);
  if (params.search) searchParams.set('search', params.search);
  if (params.sortBy) searchParams.set('sortBy', params.sortBy);
  if (params.startDate) searchParams.set('startDate', params.startDate);
  if (params.endDate) searchParams.set('endDate', params.endDate);
  if (params.authorId) searchParams.set('authorId', String(params.authorId));

  const response = await fetch(`/api/notices?${searchParams.toString()}`);

  if (!response.ok) {
    throw new Error('Failed to fetch notices');
  }

  return response.json();
}

export function useNotices(params: NoticeListParams = {}) {
  return useQuery({
    queryKey: [NOTICES_QUERY_KEY, params],
    queryFn: () => fetchNotices(params),
    staleTime: 5 * 60 * 1000, // 5분
    gcTime: 30 * 60 * 1000, // 30분
    placeholderData: keepPreviousData, // 페이지 전환 시 이전 데이터 유지
  });
}

export { NOTICES_QUERY_KEY };
```

### useNotice.ts - 상세 조회

```typescript
// Generated: 2026-01-28 15:30:00 KST

import { useQuery } from '@tanstack/react-query';
import type { NoticeDetail } from '@/types/notice';

const NOTICE_DETAIL_KEY = 'notices-detail';

async function fetchNotice(id: number): Promise<{ data: NoticeDetail }> {
  const response = await fetch(`/api/notices/${id}`);

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Notice not found');
    }
    throw new Error('Failed to fetch notice');
  }

  return response.json();
}

export function useNotice(id: number | undefined) {
  return useQuery({
    queryKey: [NOTICE_DETAIL_KEY, id],
    queryFn: () => fetchNotice(id!),
    enabled: !!id && id > 0,
    staleTime: 10 * 60 * 1000, // 10분 (ISR과 동기화)
    gcTime: 30 * 60 * 1000, // 30분
  });
}

export { NOTICE_DETAIL_KEY };
```

### useNoticesMutations.ts - 게시물 변경

```typescript
// Generated: 2026-01-28 15:30:00 KST

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { NOTICES_QUERY_KEY } from './useNotices';
import { NOTICE_DETAIL_KEY } from './useNotice';
import type {
  CreateNoticeRequest,
  UpdateNoticeRequest,
  NoticeResponse,
} from '@/types/notice';

// 게시물 생성
async function createNotice(data: FormData): Promise<NoticeResponse> {
  const response = await fetch('/api/notices', {
    method: 'POST',
    body: data,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create notice');
  }

  return response.json();
}

// 게시물 수정
async function updateNotice(params: { id: number; data: UpdateNoticeRequest }): Promise<NoticeResponse> {
  const response = await fetch(`/api/notices/${params.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params.data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update notice');
  }

  return response.json();
}

// 게시물 삭제
async function deleteNotice(params: { id: number; reason?: string }): Promise<void> {
  const response = await fetch(`/api/notices/${params.id}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason: params.reason }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to delete notice');
  }
}

export function useCreateNotice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createNotice,
    onSuccess: () => {
      // 목록 캐시 무효화
      queryClient.invalidateQueries({ queryKey: [NOTICES_QUERY_KEY] });
    },
  });
}

export function useUpdateNotice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateNotice,
    onSuccess: (_, variables) => {
      // 목록 및 상세 캐시 무효화
      queryClient.invalidateQueries({ queryKey: [NOTICES_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [NOTICE_DETAIL_KEY, variables.id] });
    },
  });
}

export function useDeleteNotice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteNotice,
    onSuccess: (_, variables) => {
      // 목록 캐시 무효화
      queryClient.invalidateQueries({ queryKey: [NOTICES_QUERY_KEY] });
      // 상세 캐시 제거
      queryClient.removeQueries({ queryKey: [NOTICE_DETAIL_KEY, variables.id] });
    },
  });
}
```

### useComments.ts - 댓글 조회

```typescript
// Generated: 2026-01-28 15:30:00 KST

import { useQuery } from '@tanstack/react-query';
import type { CommentListResponse } from '@/types/notice';

const COMMENTS_QUERY_KEY = 'notices-comments';

async function fetchComments(
  noticeId: number,
  page: number = 1,
  pageSize: number = 50
): Promise<CommentListResponse> {
  const response = await fetch(
    `/api/notices/${noticeId}/comments?page=${page}&pageSize=${pageSize}`
  );

  if (!response.ok) {
    throw new Error('Failed to fetch comments');
  }

  return response.json();
}

export function useComments(noticeId: number | undefined, page: number = 1, pageSize: number = 50) {
  return useQuery({
    queryKey: [COMMENTS_QUERY_KEY, noticeId, page, pageSize],
    queryFn: () => fetchComments(noticeId!, page, pageSize),
    enabled: !!noticeId && noticeId > 0,
    staleTime: 3 * 60 * 1000, // 3분
    gcTime: 15 * 60 * 1000, // 15분
  });
}

export { COMMENTS_QUERY_KEY };
```

### useCommentsMutations.ts - 댓글 변경

```typescript
// Generated: 2026-01-28 15:30:00 KST

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { COMMENTS_QUERY_KEY } from './useComments';
import type { CreateCommentRequest, UpdateCommentRequest, CommentResponse } from '@/types/notice';

// 댓글 작성
async function createComment(params: {
  noticeId: number;
  data: CreateCommentRequest;
}): Promise<CommentResponse> {
  const response = await fetch(`/api/notices/${params.noticeId}/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params.data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create comment');
  }

  return response.json();
}

// 댓글 수정
async function updateComment(params: {
  noticeId: number;
  commentId: number;
  data: UpdateCommentRequest;
}): Promise<CommentResponse> {
  const response = await fetch(`/api/notices/${params.noticeId}/comments/${params.commentId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params.data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update comment');
  }

  return response.json();
}

// 댓글 삭제
async function deleteComment(params: { noticeId: number; commentId: number }): Promise<void> {
  const response = await fetch(`/api/notices/${params.noticeId}/comments/${params.commentId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to delete comment');
  }
}

export function useCreateComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createComment,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [COMMENTS_QUERY_KEY, variables.noticeId] });
    },
  });
}

export function useUpdateComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateComment,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [COMMENTS_QUERY_KEY, variables.noticeId] });
    },
  });
}

export function useDeleteComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteComment,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [COMMENTS_QUERY_KEY, variables.noticeId] });
    },
  });
}
```

### index.ts - 내보내기

```typescript
// Generated: 2026-01-28 15:30:00 KST

export * from './useNotices';
export * from './useNotice';
export * from './useNoticesMutations';
export * from './useComments';
export * from './useCommentsMutations';
```

---

## 캐시 전략

| 쿼리 | staleTime | gcTime | 무효화 시점 |
|------|-----------|--------|-------------|
| notices-list | 5분 | 30분 | 게시물 생성/수정/삭제 |
| notices-detail | 10분 | 30분 | 해당 게시물 수정/삭제 |
| notices-comments | 3분 | 15분 | 댓글 생성/수정/삭제 |
| notices-statistics | 30분 | 60분 | - |

---

## Acceptance Criteria

- [ ] useNotices 훅 구현
- [ ] useNotice 훅 구현
- [ ] useNoticesMutations 훅 구현
- [ ] useComments 훅 구현
- [ ] useCommentsMutations 훅 구현
- [ ] 캐시 무효화 전략 적용

---

## 완료 체크리스트

- [ ] `npm run type-check` 통과
- [ ] `npm run lint` 통과
- [ ] 캐시 동작 확인

---

**다음 문서**: 2101_12_Zustand_Store.md
