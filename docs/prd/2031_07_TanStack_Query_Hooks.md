<!-- Generated: 2026-01-25 05:10:00 KST -->

# TanStack Query Hooks

**문서 번호**: 2031_07
**원본 PRD**: 2031_기술지원_관리_prd_v2.md
**PRD 참조**: 원본 PRD의 'Section 5.4 — State Management' 참조
**구현 범위**: 기술지원 CRUD + 파일 + 고객사 목록 TanStack Query Hooks
**복잡도**: M
**의존성**: 2031_04, 2031_05, 2031_06

---

## 구현 목표

기술지원 모듈의 서버 상태를 관리하는 TanStack Query hooks를 구현한다. Query Key Factory, 캐시 무효화, 고객사 목록 캐싱을 포함한다.

---

## 구현 내용

### 파일 구조

```
src/hooks/
├── support.ts          # 기술지원 관련 hooks
└── customers.ts        # 고객사 목록 hook
```

### 구현 상세

#### Query Key Factory

```typescript
export const techSupportKeys = {
  all: ['support'] as const,
  lists: () => [...techSupportKeys.all, 'list'] as const,
  list: (params: TechSupportSearchParams) => [...techSupportKeys.lists(), params] as const,
  details: () => [...techSupportKeys.all, 'detail'] as const,
  detail: (id: number) => [...techSupportKeys.details(), id] as const,
};

export const customerKeys = {
  all: ['customers'] as const,
  list: () => [...customerKeys.all, 'list'] as const,
};
```

#### Hooks 목록

| Hook | Type | Description |
|------|------|-------------|
| `useTechSupportSearchQuery` | useQuery | 목록 검색 (keepPreviousData) |
| `useTechSupportDetailQuery` | useQuery | 상세 조회 |
| `useCreateTechSupportMutation` | useMutation | 등록 |
| `useUpdateTechSupportMutation` | useMutation | 수정 |
| `useDeleteTechSupportMutation` | useMutation | 삭제 |
| `useUploadAttachmentMutation` | useMutation | 파일 업로드 |
| `useDeleteAttachmentMutation` | useMutation | 파일 삭제 |
| `useCustomerListQuery` | useQuery | 고객사 목록 (staleTime: 5분) |

### 핵심 인터페이스

```typescript
// src/hooks/support.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function useTechSupportSearchQuery(params: TechSupportSearchParams) {
  return useQuery({
    queryKey: techSupportKeys.list(params),
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          searchParams.set(key, String(value));
        }
      });
      const res = await fetch(`/api/support?${searchParams}`);
      if (!res.ok) throw new Error('Failed to fetch');
      return res.json() as Promise<TechSupportSearchResponse>;
    },
    enabled: !!params.date_from && !!params.date_to,
    placeholderData: (prev) => prev, // keepPreviousData equivalent
  });
}

export function useTechSupportDetailQuery(id: number | null) {
  return useQuery({
    queryKey: techSupportKeys.detail(id!),
    queryFn: async () => {
      const res = await fetch(`/api/support/${id}`);
      if (!res.ok) throw new Error('Failed to fetch');
      return res.json() as Promise<TechSupportRecord>;
    },
    enabled: id !== null,
  });
}

export function useCreateTechSupportMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateTechSupportRequest) => {
      const res = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to create');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: techSupportKeys.lists() });
    },
  });
}

export function useUpdateTechSupportMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdateTechSupportRequest }) => {
      const res = await fetch(`/api/support/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to update');
      }
      return res.json();
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: techSupportKeys.lists() });
      queryClient.invalidateQueries({ queryKey: techSupportKeys.detail(id) });
    },
  });
}

export function useDeleteTechSupportMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/support/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: techSupportKeys.lists() });
    },
  });
}

export function useUploadAttachmentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, file }: { id: number; file: File }) => {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`/api/support/${id}/attachment`, {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Upload failed');
      }
      return res.json();
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: techSupportKeys.detail(id) });
    },
  });
}

export function useDeleteAttachmentMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/support/${id}/attachment`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete attachment');
    },
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: techSupportKeys.detail(id) });
    },
  });
}

// src/hooks/customers.ts
export function useCustomerListQuery() {
  return useQuery({
    queryKey: customerKeys.list(),
    queryFn: async () => {
      const res = await fetch('/api/customers/list');
      if (!res.ok) throw new Error('Failed to fetch customers');
      return res.json() as Promise<CustomerListResponse>;
    },
    staleTime: 5 * 60 * 1000, // 5분
  });
}
```

---

## Acceptance Criteria

- [ ] 8개 hook 모두 구현
- [ ] Query Key Factory 패턴 적용
- [ ] 목록 검색: enabled 조건 (date_from, date_to 필수)
- [ ] 목록 검색: placeholderData (이전 데이터 유지)
- [ ] 상세 조회: enabled 조건 (id !== null)
- [ ] Mutation: 성공 시 관련 쿼리 무효화
- [ ] 파일 업로드: FormData 사용
- [ ] 고객사 목록: staleTime 5분
- [ ] 에러 처리: throw Error with message
- [ ] `npm run type-check` 통과

---

## 테스트 전략

### 단위 테스트

**테스트 파일**: `src/__tests__/hooks/support.test.ts`

```typescript
describe('useTechSupportSearchQuery', () => {
  it('should fetch with correct params');
  it('should not fetch when dates are empty');
  it('should handle error');
});

describe('useCreateTechSupportMutation', () => {
  it('should call POST /api/support');
  it('should invalidate list queries on success');
});

describe('useUpdateTechSupportMutation', () => {
  it('should call PUT /api/support/[id]');
  it('should invalidate list and detail queries');
  it('should throw with error message on failure');
});

describe('useUploadAttachmentMutation', () => {
  it('should upload file with FormData');
  it('should invalidate detail query on success');
});

describe('useCustomerListQuery', () => {
  it('should fetch customer list');
  it('should use 5min staleTime');
});
```

---

## 완료 체크리스트

- [ ] TypeScript 빌드 성공
- [ ] ESLint/Prettier 통과
- [ ] 단위 테스트 통과
- [ ] Query Key Factory 패턴 준수
- [ ] 캐시 무효화 동작 확인

---

**다음 문서**: 2031_08_검색_페이지_컴포넌트.md
