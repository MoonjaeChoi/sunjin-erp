<!-- Generated: 2026-01-25 21:30:00 KST -->

# TanStack Query Hooks

**문서 번호**: 2061_14
**원본 PRD**: 2061_재고_관리_prd_v2.md (Section 5.4, 5.4.1)
**구현 범위**: `src/hooks/useInventory*.ts` (모든 쿼리/뮤테이션 hooks)
**복잡도**: L
**의존성**: 2061_12 (Types), 2061_13 (Service)

---

## 구현 목표

재고 관리 모든 데이터 페칭, 캐싱, 뮤테이션을 관리하는 TanStack Query hooks를 구현한다. 캐시 무효화 전략(Decision 7)을 정확히 구현하며, 낙관적 업데이트(optimistic updates)를 지원한다.

---

## 구현 내용

### 파일 구조

```
src/hooks/
├── useInventoryList.ts          # GET /api/inventory
├── useInventoryDetail.ts        # GET /api/inventory/[id]
├── useInventoryStats.ts         # GET /api/inventory/stats
└── useInventoryMutations.ts     # POST, PUT, DELETE handlers
```

### 1. useInventoryList.ts

```typescript
import { useQuery } from '@tanstack/react-query';
import { InventoryListResponse, InventorySearchParams } from '@/types/inventory';

const defaultParams: InventorySearchParams = {
  page: 1,
  pageSize: 20,
};

export function useInventoryList(params: Partial<InventorySearchParams> = {}) {
  const finalParams = { ...defaultParams, ...params };

  return useQuery({
    queryKey: [
      'inventory-list',
      finalParams.page,
      finalParams.pageSize,
      finalParams.categories,
      finalParams.status,
      finalParams.location,
      finalParams.search,
      finalParams.sortBy,
      finalParams.order,
    ],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      searchParams.set('page', String(finalParams.page));
      searchParams.set('pageSize', String(finalParams.pageSize));

      if (finalParams.categories?.length) {
        finalParams.categories.forEach((c) => {
          searchParams.append('categories', c);
        });
      }
      if (finalParams.status?.length) {
        finalParams.status.forEach((s) => {
          searchParams.append('status', s);
        });
      }
      if (finalParams.location) {
        searchParams.set('location', finalParams.location);
      }
      if (finalParams.search) {
        searchParams.set('search', finalParams.search);
      }
      if (finalParams.sortBy) {
        searchParams.set('sortBy', finalParams.sortBy);
      }
      if (finalParams.order) {
        searchParams.set('order', finalParams.order);
      }

      const response = await fetch(
        `/api/inventory?${searchParams.toString()}`
      );
      if (!response.ok) throw new Error('Failed to fetch inventory list');
      return response.json() as Promise<InventoryListResponse>;
    },
    staleTime: 30000, // 30초
    gcTime: 5 * 60 * 1000, // 5분 (이전 cacheTime)
  });
}
```

### 2. useInventoryDetail.ts

```typescript
import { useQuery } from '@tanstack/react-query';
import { InventoryDetail } from '@/types/inventory';

export function useInventoryDetail(id: number) {
  return useQuery({
    queryKey: ['inventory-detail', id],
    queryFn: async () => {
      const response = await fetch(`/api/inventory/${id}`);
      if (!response.ok) throw new Error('Failed to fetch inventory detail');
      return response.json() as Promise<InventoryDetail>;
    },
    staleTime: 30000, // 30초
    gcTime: 5 * 60 * 1000, // 5분
    enabled: id !== undefined,
  });
}
```

### 3. useInventoryStats.ts

```typescript
import { useQuery } from '@tanstack/react-query';
import { InventoryStatistics } from '@/types/inventory';

export function useInventoryStats() {
  return useQuery({
    queryKey: ['inventory-stats'],
    queryFn: async () => {
      const response = await fetch('/api/inventory/stats');
      if (!response.ok) throw new Error('Failed to fetch inventory stats');
      return response.json() as Promise<InventoryStatistics>;
    },
    staleTime: 60000, // 1분
    gcTime: 5 * 60 * 1000, // 5분
  });
}
```

### 4. useInventoryMutations.ts

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CreateInventoryRequest,
  CheckoutRequest,
  CheckinRequest,
  RelocateRequest,
  StatusChangeRequest,
  InventoryDetail,
  InventoryListItem,
} from '@/types/inventory';

export function useInventoryMutations() {
  const queryClient = useQueryClient();

  // ===== Invalidate helpers =====

  const invalidateDetail = (id: number) => {
    queryClient.invalidateQueries({ queryKey: ['inventory-detail', id] });
  };

  const invalidateListAndStats = () => {
    queryClient.invalidateQueries({ queryKey: ['inventory-list'] });
    queryClient.invalidateQueries({ queryKey: ['inventory-stats'] });
  };

  const invalidateListOnly = () => {
    queryClient.invalidateQueries({ queryKey: ['inventory-list'] });
  };

  // ===== 입고 등록 =====

  const createMutation = useMutation({
    mutationFn: async (data: CreateInventoryRequest) => {
      const response = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create inventory');
      return response.json() as Promise<InventoryDetail>;
    },
    onSuccess: () => {
      invalidateListAndStats();
    },
  });

  // ===== 출고 처리 =====

  const checkoutMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: CheckoutRequest;
    }) => {
      const response = await fetch(`/api/inventory/${id}/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to checkout inventory');
      return response.json();
    },
    onSuccess: (_, { id }) => {
      invalidateDetail(id);
      invalidateListAndStats();
    },
  });

  // ===== 반납 처리 =====

  const checkinMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: CheckinRequest;
    }) => {
      const response = await fetch(`/api/inventory/${id}/checkin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to checkin inventory');
      return response.json();
    },
    onSuccess: (_, { id }) => {
      invalidateDetail(id);
      invalidateListAndStats();
    },
  });

  // ===== 위치 변경 =====

  const relocateMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: RelocateRequest;
    }) => {
      const response = await fetch(`/api/inventory/${id}/relocate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to relocate inventory');
      return response.json();
    },
    onSuccess: (_, { id }) => {
      invalidateDetail(id);
      invalidateListOnly();
      // Stats NOT invalidated (상태 미변경)
    },
  });

  // ===== 상태 변경 =====

  const statusChangeMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: StatusChangeRequest;
    }) => {
      const response = await fetch(`/api/inventory/${id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to change status');
      return response.json();
    },
    onSuccess: (_, { id }) => {
      invalidateDetail(id);
      invalidateListAndStats();
    },
  });

  // ===== 기본 정보 수정 =====

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: number;
      data: Partial<CreateInventoryRequest>;
    }) => {
      const response = await fetch(`/api/inventory/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update inventory');
      return response.json();
    },
    onSuccess: (_, { id }) => {
      invalidateDetail(id);
      invalidateListAndStats();
    },
  });

  // ===== 소프트 삭제 =====

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/inventory/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete inventory');
      return response.json();
    },
    onSuccess: () => {
      invalidateListAndStats();
      // Detail NOT invalidated (조회 불가)
    },
  });

  return {
    createMutation,
    checkoutMutation,
    checkinMutation,
    relocateMutation,
    statusChangeMutation,
    updateMutation,
    deleteMutation,
  };
}
```

---

## 캐시 무효화 전략 (Decision 7)

| 작업 | inventory-list | inventory-detail | inventory-stats |
|------|---------------|-----------------|-----------------|
| 입고 등록 | ✓ | — | ✓ |
| 정보 수정 | ✓ | ✓ | ✓ |
| 출고 처리 | ✓ | ✓ | ✓ |
| 반납 처리 | ✓ | ✓ | ✓ |
| 위치 변경 | ✓ | ✓ | ✗ (상태 미변경) |
| 상태 변경 | ✓ | ✓ | ✓ |
| 소프트 삭제 | ✓ | ✗ | ✓ |

---

## Acceptance Criteria

- [ ] `useInventoryList` hook 구현 (필터, 정렬, 페이지네이션)
- [ ] `useInventoryDetail` hook 구현 (id 기반)
- [ ] `useInventoryStats` hook 구현
- [ ] `useInventoryMutations` hook 구현 (7가지 뮤테이션)
- [ ] 캐시 무효화 전략 정확히 구현
- [ ] staleTime, gcTime 설정 (30초/1분, 5분)
- [ ] queryKey 배열 정확성 (모든 필터 포함)
- [ ] 에러 처리 (throw new Error)
- [ ] TypeScript 타입 안정성
- [ ] TanStack Query 최신 문법 (useQuery, useMutation, useQueryClient)

---

**다음 문서**: 2061_15_재고_목록_페이지.md
