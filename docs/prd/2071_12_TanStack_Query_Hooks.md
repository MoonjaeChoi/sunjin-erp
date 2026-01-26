<!-- Generated: 2026-01-26 21:30:00 KST -->

# TanStack Query Hooks

**문서 번호**: 2071_12
**원본 PRD**: `docs/prd/2071_유지보수_고객_관리_prd_v2.md`
**구현 범위**: React Query hooks for data fetching, caching, mutations
**복잡도**: M (1-2일)
**의존성**: 2071_05~11 (API 구현 + 타입 정의)

---

## 구현 목표

TanStack Query를 사용하여 다음을 제공하는 React hooks를 구현합니다:
- 계약 목록 조회 (캐싱 + 페이지네이션)
- 계약 상세 조회 (백그라운드 리페치)
- 계약 생성/수정/삭제 (optimistic updates)
- 상태 변경 (낙관적 업데이트)
- 첨부 파일 관리
- 이력 + 통계 조회
- 자동 invalidation

---

## 구현 내용

### 파일 구조

```
src/hooks/
├── useMaintenanceContracts.ts      # List with filters & pagination
├── useMaintenanceContractDetail.ts # Detail with dependencies
├── useMaintenanceContractMutation.ts # Create/Update/Delete
├── useStatusChange.ts              # Status change mutation
├── useAttachmentMutation.ts        # File upload/delete
└── useMaintenanceStats.ts          # Stats + history
```

### 1. useMaintenanceContracts.ts - 목록 조회

```typescript
// Generated: 2026-01-26 HH:MM:SS KST

import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { useSearchParams } from 'next/navigation';
import {
  GetMaintenanceContractsResponse,
  MaintenanceListFilters
} from '@/types/maintenance';

/**
 * 유지보수 계약 목록 조회 (필터 + 정렬 + 페이지네이션)
 *
 * Stale Time: 5분 (페이지 유지 시 데이터 재사용)
 * Cache Time: 10분 (탭 전환 후 복귀 시 데이터 복구)
 */
export function useMaintenanceContracts(
  filters?: MaintenanceListFilters
): UseQueryResult<GetMaintenanceContractsResponse, Error> {
  const searchParams = useSearchParams();

  const params = new URLSearchParams();

  // 필터 파라미터
  if (filters?.status) params.append('status', filters.status);
  if (filters?.customerId) params.append('customerId', filters.customerId.toString());
  if (filters?.assignedEmployeeId) params.append('assignedEmployeeId', filters.assignedEmployeeId.toString());
  if (filters?.contractNameSearch) params.append('contractNameSearch', filters.contractNameSearch);
  if (filters?.startDateFrom) params.append('startDateFrom', filters.startDateFrom);
  if (filters?.startDateTo) params.append('startDateTo', filters.startDateTo);
  if (filters?.endDateFrom) params.append('endDateFrom', filters.endDateFrom);
  if (filters?.endDateTo) params.append('endDateTo', filters.endDateTo);

  // 정렬 파라미터
  if (filters?.sortBy) params.append('sortBy', filters.sortBy);
  if (filters?.sortOrder) params.append('sortOrder', filters.sortOrder);

  // 페이지네이션
  const page = filters?.page || 1;
  const limit = filters?.limit || 20;
  params.append('page', page.toString());
  params.append('limit', limit.toString());

  return useQuery({
    queryKey: ['maintenance', 'list', filters],
    queryFn: async () => {
      const response = await fetch(`/api/maintenance?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch contracts');
      return response.json();
    },
    staleTime: 5 * 60 * 1000,      // 5분
    cacheTime: 10 * 60 * 1000,     // 10분
    refetchOnWindowFocus: false    // 창 포커스 시 리페치 안 함
  });
}

/**
 * 계약 목록 조회 (URL 검색 파라미터 기반)
 */
export function useMaintenanceContractsFromUrl(): UseQueryResult<GetMaintenanceContractsResponse, Error> {
  const searchParams = useSearchParams();

  const filters: MaintenanceListFilters = {
    status: (searchParams.get('status') as any) || undefined,
    customerId: searchParams.get('customerId') ? parseInt(searchParams.get('customerId')!) : undefined,
    contractNameSearch: searchParams.get('search') || undefined,
    page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1,
    limit: 20
  };

  return useMaintenanceContracts(filters);
}
```

### 2. useMaintenanceContractDetail.ts - 상세 조회

```typescript
// Generated: 2026-01-26 HH:MM:SS KST

import { useQuery, UseQueryResult } from '@tanstack/react-query';
import {
  GetMaintenanceContractResponse,
  MaintenanceContractDetail
} from '@/types/maintenance';

/**
 * 유지보수 계약 상세 조회 (첨부 + 이력 포함)
 *
 * Stale Time: 3분 (상세 페이지 유지 시 데이터 재사용)
 * 백그라운드 리페치: 10분마다 최신 상태 확인
 */
export function useMaintenanceContractDetail(
  id?: number
): UseQueryResult<MaintenanceContractDetail, Error> {
  return useQuery({
    queryKey: ['maintenance', 'detail', id],
    queryFn: async () => {
      if (!id) throw new Error('Contract ID is required');
      const response = await fetch(`/api/maintenance/${id}`);
      if (!response.ok) {
        if (response.status === 404) throw new Error('Contract not found');
        throw new Error('Failed to fetch contract details');
      }
      const data = await response.json();
      return data.data; // API returns { data: MaintenanceContractDetail }
    },
    enabled: !!id,              // id가 있을 때만 실행
    staleTime: 3 * 60 * 1000,   // 3분
    refetchInterval: 10 * 60 * 1000,  // 10분마다 리페치
    retry: 3                    // 실패 시 3회 재시도
  });
}

/**
 * 계약 상세 + 관련 데이터 (의존성 있는 쿼리)
 */
export function useMaintenanceContractWithDependencies(contractId?: number) {
  const contract = useMaintenanceContractDetail(contractId);

  // 필요시 다른 hooks 추가 (예: 담당자 정보, 고객 정보)

  return {
    contract,
    isLoading: contract.isLoading,
    error: contract.error,
    data: contract.data
  };
}
```

### 3. useMaintenanceContractMutation.ts - Create/Update/Delete

```typescript
// Generated: 2026-01-26 HH:MM:SS KST

import { useMutation, useQueryClient, UseMutationResult } from '@tanstack/react-query';
import {
  MaintenanceContractFormData,
  CreateMaintenanceContractResponse
} from '@/types/maintenance';
import { toast } from '@/components/ui/use-toast';

/**
 * 계약 생성 mutation (낙관적 업데이트)
 */
export function useCreateMaintenanceContract(): UseMutationResult<
  CreateMaintenanceContractResponse,
  Error,
  MaintenanceContractFormData
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: MaintenanceContractFormData) => {
      const response = await fetch('/api/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create contract');
      }

      return response.json();
    },
    onSuccess: () => {
      // 목록 캐시 무효화 → 자동으로 리페치됨
      queryClient.invalidateQueries({ queryKey: ['maintenance', 'list'] });
      // 통계 캐시 무효화
      queryClient.invalidateQueries({ queryKey: ['maintenance', 'stats'] });
      toast({ title: '계약이 생성되었습니다' });
    },
    onError: (error) => {
      toast({
        title: '계약 생성 실패',
        description: error.message,
        variant: 'destructive'
      });
    }
  });
}

/**
 * 계약 수정 mutation (낙관적 업데이트)
 */
export function useUpdateMaintenanceContract(
  contractId: number
): UseMutationResult<CreateMaintenanceContractResponse, Error, MaintenanceContractFormData> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: MaintenanceContractFormData) => {
      const response = await fetch(`/api/maintenance/${contractId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (!response.ok) throw new Error('Failed to update contract');
      return response.json();
    },
    onMutate: async (data) => {
      // 낙관적 업데이트: 요청 전에 캐시 업데이트
      await queryClient.cancelQueries({
        queryKey: ['maintenance', 'detail', contractId]
      });

      // 이전 데이터 백업
      const previousData = queryClient.getQueryData([
        'maintenance',
        'detail',
        contractId
      ]);

      // 낙관적으로 업데이트
      queryClient.setQueryData(['maintenance', 'detail', contractId], (old: any) => ({
        ...old,
        ...data
      }));

      return { previousData };
    },
    onError: (error, variables, context: any) => {
      // 실패 시 이전 데이터로 복구
      if (context?.previousData) {
        queryClient.setQueryData(
          ['maintenance', 'detail', contractId],
          context.previousData
        );
      }
    },
    onSuccess: () => {
      // 모든 관련 캐시 무효화
      queryClient.invalidateQueries({ queryKey: ['maintenance', 'list'] });
      queryClient.invalidateQueries({ queryKey: ['maintenance', 'detail', contractId] });
      queryClient.invalidateQueries({ queryKey: ['maintenance', 'stats'] });
      toast({ title: '계약이 수정되었습니다' });
    }
  });
}

/**
 * 계약 삭제 mutation (soft delete)
 */
export function useDeleteMaintenanceContract(): UseMutationResult<
  void,
  Error,
  number
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (contractId: number) => {
      const response = await fetch(`/api/maintenance/${contractId}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Failed to delete contract');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance', 'list'] });
      queryClient.invalidateQueries({ queryKey: ['maintenance', 'stats'] });
      toast({ title: '계약이 삭제되었습니다' });
    },
    onError: (error) => {
      toast({
        title: '계약 삭제 실패',
        description: error.message,
        variant: 'destructive'
      });
    }
  });
}
```

### 4. useStatusChange.ts - 상태 변경

```typescript
// Generated: 2026-01-26 HH:MM:SS KST

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ContractStatus, StatusChangeResponse } from '@/types/maintenance';

/**
 * 계약 상태 변경 mutation
 */
export function useStatusChange(contractId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { status: ContractStatus; reason: string }) => {
      const response = await fetch(`/api/maintenance/${contractId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error('Failed to change status');
      return response.json() as Promise<StatusChangeResponse>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenance', 'detail', contractId] });
      queryClient.invalidateQueries({ queryKey: ['maintenance', 'list'] });
      queryClient.invalidateQueries({ queryKey: ['maintenance', 'stats'] });
    }
  });
}
```

### 5. useAttachmentMutation.ts - 파일 관리

```typescript
// Generated: 2026-01-26 HH:MM:SS KST

import { useMutation, useQueryClient } from '@tanstack/react-query';

/**
 * 첨부 파일 업로드 mutation
 */
export function useUploadAttachment(contractId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`/api/maintenance/${contractId}/attachments`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) throw new Error('Failed to upload file');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['maintenance', 'attachments', contractId]
      });
      queryClient.invalidateQueries({
        queryKey: ['maintenance', 'detail', contractId]
      });
    }
  });
}

/**
 * 첨부 파일 삭제 mutation
 */
export function useDeleteAttachment(contractId: number, attachmentId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await fetch(
        `/api/maintenance/${contractId}/attachments/${attachmentId}`,
        { method: 'DELETE' }
      );

      if (!response.ok) throw new Error('Failed to delete attachment');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['maintenance', 'attachments', contractId]
      });
    }
  });
}
```

### 6. useMaintenanceStats.ts - 통계 및 이력

```typescript
// Generated: 2026-01-26 HH:MM:SS KST

import { useQuery } from '@tanstack/react-query';
import {
  GetStatsResponse,
  GetHistoryResponse,
  MaintenanceContractHistory
} from '@/types/maintenance';

/**
 * 유지보수 계약 통계 조회
 */
export function useMaintenanceStats() {
  return useQuery({
    queryKey: ['maintenance', 'stats'],
    queryFn: async () => {
      const response = await fetch('/api/maintenance/stats');
      if (!response.ok) throw new Error('Failed to fetch stats');
      return response.json() as Promise<GetStatsResponse>;
    },
    staleTime: 15 * 60 * 1000,  // 15분
    refetchInterval: 30 * 60 * 1000  // 30분마다 리페치
  });
}

/**
 * 계약 변경 이력 조회
 */
export function useMaintenanceHistory(
  contractId: number,
  page: number = 1
) {
  return useQuery({
    queryKey: ['maintenance', 'history', contractId, page],
    queryFn: async () => {
      const response = await fetch(
        `/api/maintenance/${contractId}/history?page=${page}&limit=20`
      );
      if (!response.ok) throw new Error('Failed to fetch history');
      return response.json() as Promise<GetHistoryResponse>;
    },
    enabled: !!contractId,
    staleTime: 5 * 60 * 1000
  });
}
```

---

## Acceptance Criteria

- [ ] useMaintenanceContracts 구현 (필터 + 페이지네이션)
- [ ] useMaintenanceContractDetail 구현 (백그라운드 리페치)
- [ ] useCreateMaintenanceContract 구현 (낙관적 업데이트)
- [ ] useUpdateMaintenanceContract 구현 (낙관적 업데이트)
- [ ] useDeleteMaintenanceContract 구현
- [ ] useStatusChange 구현
- [ ] useUploadAttachment, useDeleteAttachment 구현
- [ ] useMaintenanceStats, useMaintenanceHistory 구현
- [ ] 모든 hooks에 적절한 staleTime/cacheTime 설정
- [ ] 모든 mutations에 invalidation 로직 포함
- [ ] npm run type-check 통과
- [ ] 단위 테스트 작성 (mocking 포함)

---

## 테스트 전략

### TypeScript 검증

```bash
npm run build              # Next.js 빌드
npm run type-check         # TypeScript 검증
npm run lint               # ESLint
```

### Hooks 테스트

```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useMaintenanceContracts } from '@/hooks/useMaintenanceContracts';

describe('useMaintenanceContracts', () => {
  it('should fetch contracts with filters', async () => {
    const queryClient = new QueryClient();
    const wrapper = ({ children }) => (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );

    const { result } = renderHook(
      () => useMaintenanceContracts({ status: '활성' }),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data?.data).toBeDefined();
  });
});
```

---

## 완료 체크리스트

- [ ] useMaintenanceContracts.ts 작성
- [ ] useMaintenanceContractDetail.ts 작성
- [ ] useMaintenanceContractMutation.ts 작성
- [ ] useStatusChange.ts 작성
- [ ] useAttachmentMutation.ts 작성
- [ ] useMaintenanceStats.ts 작성
- [ ] 모든 hooks에 TSDoc 주석 작성
- [ ] staleTime/cacheTime 적절히 설정
- [ ] invalidateQueries 로직 완성
- [ ] 단위 테스트 작성
- [ ] npm run test 통과
- [ ] npm run type-check 통과

---

**다음 문서**: `2071_13_커스텀_유틸리티_Hooks.md`
