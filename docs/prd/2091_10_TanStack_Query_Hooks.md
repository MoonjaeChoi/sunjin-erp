<!-- Generated: 2026-01-28 05:00:00 KST -->

# TanStack Query Hooks

**문서 번호**: 2091_10
**원본 PRD**: 2091_직원_관리_prd_v2.md
**PRD 참조**: 원본 PRD의 'Section 4.1 In-Scope (TanStack Query Hooks)', 'Section 5.4 State Management' 참조
**구현 범위**: useEmployees, useDepartments, usePositions 등 TanStack Query Hooks
**복잡도**: M (1-2일)
**의존성**: 2091_09

---

## 구현 목표

직원 관리 모듈의 모든 데이터 조회/변경을 위한 TanStack Query Hooks를 구현합니다. 캐시 무효화 전략(Decision #8)을 적용합니다.

---

## 구현 내용

### 파일 구조

```
src/
└── hooks/
    └── useEmployees.ts    # 직원 관리 관련 모든 hooks
```

### 구현 상세

```typescript
// src/hooks/useEmployees.ts

import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryResult,
  UseMutationResult,
} from '@tanstack/react-query';
import { fetchAPI } from '@/lib/api';
import {
  Employee,
  EmployeeDetail,
  EmployeeListItem,
  EmployeeListResponse,
  EmployeeDetailResponse,
  EmployeeListQueryParams,
  CreateEmployeeRequest,
  UpdateEmployeeRequest,
  Department,
  DepartmentWithChildren,
  CreateDepartmentRequest,
  UpdateDepartmentRequest,
  Position,
  CreatePositionRequest,
  UpdatePositionRequest,
  AccountInfo,
  CreateAccountRequest,
  CreateAccountResponse,
  UpdateAccountRoleRequest,
  EmployeeHistory,
  EmployeeHistoryResponse,
  EmployeeHistoryQueryParams,
  Pagination,
} from '@/types/employee';

// ============================================================
// Query Keys
// ============================================================

export const employeeQueryKeys = {
  all: ['employees'] as const,
  lists: () => [...employeeQueryKeys.all, 'list'] as const,
  list: (params: EmployeeListQueryParams) => [...employeeQueryKeys.lists(), params] as const,
  details: () => [...employeeQueryKeys.all, 'detail'] as const,
  detail: (id: number) => [...employeeQueryKeys.details(), id] as const,
  histories: () => [...employeeQueryKeys.all, 'history'] as const,
  history: (id: number, params?: EmployeeHistoryQueryParams) =>
    [...employeeQueryKeys.histories(), id, params] as const,
};

export const departmentQueryKeys = {
  all: ['departments'] as const,
  list: () => [...departmentQueryKeys.all, 'list'] as const,
  detail: (id: number) => [...departmentQueryKeys.all, 'detail', id] as const,
};

export const positionQueryKeys = {
  all: ['positions'] as const,
  list: () => [...positionQueryKeys.all, 'list'] as const,
  detail: (id: number) => [...positionQueryKeys.all, 'detail', id] as const,
};

// ============================================================
// Employee Hooks
// ============================================================

/**
 * 직원 목록 조회
 */
export function useEmployees(
  params: EmployeeListQueryParams = {}
): UseQueryResult<{ data: EmployeeListItem[]; pagination: Pagination }, Error> {
  const queryString = new URLSearchParams();

  if (params.page) queryString.set('page', params.page.toString());
  if (params.limit) queryString.set('limit', params.limit.toString());
  if (params.search) queryString.set('search', params.search);
  if (params.departmentId) queryString.set('departmentId', params.departmentId.toString());
  if (params.positionId) queryString.set('positionId', params.positionId.toString());
  if (params.isActive !== undefined) queryString.set('isActive', params.isActive.toString());
  if (params.sortBy) queryString.set('sortBy', params.sortBy);
  if (params.sortOrder) queryString.set('sortOrder', params.sortOrder);

  return useQuery({
    queryKey: employeeQueryKeys.list(params),
    queryFn: async () => {
      const response = await fetchAPI<EmployeeListResponse>(
        `/api/employees?${queryString.toString()}`
      );
      return response;
    },
    staleTime: 5 * 60 * 1000, // 5분
    gcTime: 30 * 60 * 1000, // 30분
  });
}

/**
 * 직원 상세 조회
 */
export function useEmployee(id: number | null): UseQueryResult<EmployeeDetail, Error> {
  return useQuery({
    queryKey: employeeQueryKeys.detail(id || 0),
    queryFn: async () => {
      const response = await fetchAPI<EmployeeDetailResponse>(`/api/employees/${id}`);
      return response.data;
    },
    enabled: id !== null && id > 0,
    staleTime: 10 * 60 * 1000, // 10분
    gcTime: 30 * 60 * 1000, // 30분
  });
}

/**
 * 직원 생성
 */
export function useCreateEmployee(): UseMutationResult<
  { id: number; name: string; email: string },
  Error,
  CreateEmployeeRequest
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateEmployeeRequest) => {
      const response = await fetchAPI<{ message: string; data: any }>('/api/employees', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return response.data;
    },
    onSuccess: () => {
      // 목록 캐시 무효화
      queryClient.invalidateQueries({ queryKey: employeeQueryKeys.lists() });
    },
  });
}

/**
 * 직원 정보 수정
 */
export function useUpdateEmployee(
  id: number
): UseMutationResult<void, Error, UpdateEmployeeRequest> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateEmployeeRequest) => {
      await fetchAPI(`/api/employees/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      // 상세 및 목록 캐시 무효화
      queryClient.invalidateQueries({ queryKey: employeeQueryKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: employeeQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: employeeQueryKeys.history(id) });
    },
  });
}

/**
 * 직원 삭제 (Hard Delete)
 */
export function useDeleteEmployee(): UseMutationResult<void, Error, number> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      await fetchAPI(`/api/employees/${id}`, {
        method: 'DELETE',
      });
    },
    onSuccess: (_, id) => {
      // 모든 관련 캐시 무효화
      queryClient.invalidateQueries({ queryKey: employeeQueryKeys.lists() });
      queryClient.removeQueries({ queryKey: employeeQueryKeys.detail(id) });
    },
  });
}

/**
 * 직원 이력 조회
 */
export function useEmployeeHistory(
  employeeId: number,
  params: EmployeeHistoryQueryParams = {}
): UseQueryResult<{ data: EmployeeHistory[]; pagination: Pagination }, Error> {
  const queryString = new URLSearchParams();

  if (params.page) queryString.set('page', params.page.toString());
  if (params.limit) queryString.set('limit', params.limit.toString());
  if (params.changeType) queryString.set('changeType', params.changeType);

  return useQuery({
    queryKey: employeeQueryKeys.history(employeeId, params),
    queryFn: async () => {
      const response = await fetchAPI<EmployeeHistoryResponse>(
        `/api/employees/${employeeId}/history?${queryString.toString()}`
      );
      return response;
    },
    enabled: employeeId > 0,
    staleTime: 30 * 60 * 1000, // 30분
  });
}

// ============================================================
// Account Hooks
// ============================================================

/**
 * 계정 생성
 */
export function useCreateAccount(
  employeeId: number
): UseMutationResult<CreateAccountResponse, Error, CreateAccountRequest> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateAccountRequest) => {
      const response = await fetchAPI<{ message: string; data: CreateAccountResponse }>(
        `/api/employees/${employeeId}/accounts`,
        {
          method: 'POST',
          body: JSON.stringify(data),
        }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: employeeQueryKeys.detail(employeeId) });
      queryClient.invalidateQueries({ queryKey: employeeQueryKeys.history(employeeId) });
    },
  });
}

/**
 * 계정 권한 변경
 */
export function useUpdateAccountRole(
  employeeId: number,
  accountId: number
): UseMutationResult<void, Error, UpdateAccountRoleRequest> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateAccountRoleRequest) => {
      await fetchAPI(`/api/employees/${employeeId}/accounts/${accountId}/role`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: employeeQueryKeys.detail(employeeId) });
      queryClient.invalidateQueries({ queryKey: employeeQueryKeys.history(employeeId) });
    },
  });
}

/**
 * 계정 비활성화
 */
export function useDeactivateEmployee(
  employeeId: number
): UseMutationResult<void, Error, void> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await fetchAPI(`/api/employees/${employeeId}/deactivate`, {
        method: 'POST',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: employeeQueryKeys.detail(employeeId) });
      queryClient.invalidateQueries({ queryKey: employeeQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: employeeQueryKeys.history(employeeId) });
    },
  });
}

/**
 * 계정 활성화
 */
export function useReactivateEmployee(
  employeeId: number
): UseMutationResult<void, Error, void> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await fetchAPI(`/api/employees/${employeeId}/reactivate`, {
        method: 'POST',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: employeeQueryKeys.detail(employeeId) });
      queryClient.invalidateQueries({ queryKey: employeeQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: employeeQueryKeys.history(employeeId) });
    },
  });
}

// ============================================================
// Department Hooks
// ============================================================

/**
 * 부서 목록 조회 (계층 구조)
 */
export function useDepartments(): UseQueryResult<DepartmentWithChildren[], Error> {
  return useQuery({
    queryKey: departmentQueryKeys.list(),
    queryFn: async () => {
      const response = await fetchAPI<{ data: DepartmentWithChildren[] }>('/api/departments');
      return response.data;
    },
    staleTime: 30 * 60 * 1000, // 30분
    gcTime: 60 * 60 * 1000, // 60분
  });
}

/**
 * 부서 생성
 */
export function useCreateDepartment(): UseMutationResult<
  Department,
  Error,
  CreateDepartmentRequest
> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateDepartmentRequest) => {
      const response = await fetchAPI<{ message: string; data: Department }>('/api/departments', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: departmentQueryKeys.list() });
      queryClient.invalidateQueries({ queryKey: employeeQueryKeys.lists() });
    },
  });
}

/**
 * 부서 수정
 */
export function useUpdateDepartment(
  id: number
): UseMutationResult<Department, Error, UpdateDepartmentRequest> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateDepartmentRequest) => {
      const response = await fetchAPI<{ message: string; data: Department }>(
        `/api/departments/${id}`,
        {
          method: 'PUT',
          body: JSON.stringify(data),
        }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: departmentQueryKeys.list() });
      queryClient.invalidateQueries({ queryKey: employeeQueryKeys.lists() });
    },
  });
}

/**
 * 부서 삭제
 */
export function useDeleteDepartment(): UseMutationResult<void, Error, number> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      await fetchAPI(`/api/departments/${id}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: departmentQueryKeys.list() });
      queryClient.invalidateQueries({ queryKey: employeeQueryKeys.lists() });
    },
  });
}

// ============================================================
// Position Hooks
// ============================================================

/**
 * 직급 목록 조회
 */
export function usePositions(): UseQueryResult<Position[], Error> {
  return useQuery({
    queryKey: positionQueryKeys.list(),
    queryFn: async () => {
      const response = await fetchAPI<{ data: Position[] }>('/api/positions');
      return response.data;
    },
    staleTime: 30 * 60 * 1000, // 30분
    gcTime: 60 * 60 * 1000, // 60분
  });
}

/**
 * 직급 생성
 */
export function useCreatePosition(): UseMutationResult<Position, Error, CreatePositionRequest> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreatePositionRequest) => {
      const response = await fetchAPI<{ message: string; data: Position }>('/api/positions', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: positionQueryKeys.list() });
      queryClient.invalidateQueries({ queryKey: employeeQueryKeys.lists() });
    },
  });
}

/**
 * 직급 수정
 */
export function useUpdatePosition(
  id: number
): UseMutationResult<Position, Error, UpdatePositionRequest> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdatePositionRequest) => {
      const response = await fetchAPI<{ message: string; data: Position }>(
        `/api/positions/${id}`,
        {
          method: 'PUT',
          body: JSON.stringify(data),
        }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: positionQueryKeys.list() });
      queryClient.invalidateQueries({ queryKey: employeeQueryKeys.lists() });
    },
  });
}

/**
 * 직급 삭제
 */
export function useDeletePosition(): UseMutationResult<void, Error, number> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      await fetchAPI(`/api/positions/${id}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: positionQueryKeys.list() });
      queryClient.invalidateQueries({ queryKey: employeeQueryKeys.lists() });
    },
  });
}
```

---

## Acceptance Criteria

- [ ] useEmployees - 목록 조회 (쿼리 파라미터 지원)
- [ ] useEmployee - 상세 조회
- [ ] useCreateEmployee - 생성 mutation + 캐시 무효화
- [ ] useUpdateEmployee - 수정 mutation + 캐시 무효화
- [ ] useDeleteEmployee - 삭제 mutation + 캐시 무효화
- [ ] useEmployeeHistory - 이력 조회
- [ ] useCreateAccount - 계정 생성
- [ ] useUpdateAccountRole - 권한 변경
- [ ] useDeactivateEmployee - 계정 비활성화
- [ ] useReactivateEmployee - 계정 활성화
- [ ] useDepartments - 부서 목록 (계층 구조)
- [ ] useCreateDepartment, useUpdateDepartment, useDeleteDepartment
- [ ] usePositions - 직급 목록
- [ ] useCreatePosition, useUpdatePosition, useDeletePosition
- [ ] staleTime/gcTime 설정 적용

---

## 테스트 전략

### 단위 테스트

```typescript
describe('useEmployees', () => {
  it('should fetch employee list with query params', async () => { });
  it('should cache data for 5 minutes', async () => { });
});

describe('useCreateEmployee', () => {
  it('should invalidate list cache on success', async () => { });
});
```

---

## 완료 체크리스트

- [ ] 모든 hooks 구현
- [ ] Query Keys 정의
- [ ] 캐시 무효화 전략 적용
- [ ] TypeScript 빌드 성공
- [ ] 단위 테스트 통과

---

**다음 문서**: 2091_11_직원_목록_페이지.md
