// Generated: 2026-01-28 00:20:00 KST

'use client';

import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryResult,
  UseMutationResult,
} from '@tanstack/react-query';
import {
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
  CreateAccountRequest,
  CreateAccountResponse,
  UpdateAccountRoleRequest,
  EmployeeHistory,
  EmployeeHistoryResponse,
  EmployeeHistoryQueryParams,
  Pagination,
} from '@/types/employee';

// ============================================================
// API Client Utility
// ============================================================

/**
 * Fetch wrapper with error handling
 */
async function fetchAPI<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error(error.message || `HTTP ${res.status}`);
  }

  return res.json();
}

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
      const response = await fetchAPI<{ message: string; data: { id: number; name: string; email: string } }>(
        '/api/employees',
        {
          method: 'POST',
          body: JSON.stringify(data),
        }
      );
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
 * 부서 상세 조회
 */
export function useDepartment(id: number | null): UseQueryResult<Department & { employeeCount: number }, Error> {
  return useQuery({
    queryKey: departmentQueryKeys.detail(id || 0),
    queryFn: async () => {
      const response = await fetchAPI<{ data: Department & { employeeCount: number } }>(`/api/departments/${id}`);
      return response.data;
    },
    enabled: id !== null && id > 0,
    staleTime: 10 * 60 * 1000,
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
      queryClient.invalidateQueries({ queryKey: departmentQueryKeys.detail(id) });
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
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: departmentQueryKeys.list() });
      queryClient.removeQueries({ queryKey: departmentQueryKeys.detail(id) });
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
 * 직급 상세 조회
 */
export function usePosition(id: number | null): UseQueryResult<Position & { employeeCount: number }, Error> {
  return useQuery({
    queryKey: positionQueryKeys.detail(id || 0),
    queryFn: async () => {
      const response = await fetchAPI<{ data: Position & { employeeCount: number } }>(`/api/positions/${id}`);
      return response.data;
    },
    enabled: id !== null && id > 0,
    staleTime: 10 * 60 * 1000,
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
): UseMutationResult<Position, Error, Partial<CreatePositionRequest>> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<CreatePositionRequest>) => {
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
      queryClient.invalidateQueries({ queryKey: positionQueryKeys.detail(id) });
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
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: positionQueryKeys.list() });
      queryClient.removeQueries({ queryKey: positionQueryKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: employeeQueryKeys.lists() });
    },
  });
}
