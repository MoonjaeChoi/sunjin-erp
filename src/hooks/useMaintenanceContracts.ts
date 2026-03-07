// Generated: 2026-01-27 00:30:00 KST

'use client';

import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryResult,
  UseMutationResult,
} from '@tanstack/react-query';
import {
  MaintenanceContractDetail,
  ContractFilters,
  CreateMaintenanceContractRequest,
  UpdateMaintenanceContractRequest,
  ChangeStatusRequest,
  ContractListResponse,
  ContractDetailResponse,
  ContractStatsResponse,
  MaintenanceContractAttachment,
  MaintenanceContractHistory,
  AttachmentUploadResponse,
} from '@/types/maintenance';

// ============================================================================
// API Client Utilities
// ============================================================================

/**
 * Fetch wrapper with error handling
 */
async function fetchAPI<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(url, options);

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.details || error.error || `HTTP ${res.status}`);
  }

  return res.json();
}

// ============================================================================
// Query Keys
// ============================================================================

const maintenanceQueryKeys = {
  all: () => ['maintenance_contracts'],
  lists: () => [...maintenanceQueryKeys.all(), 'list'],
  list: (filters?: ContractFilters) => [...maintenanceQueryKeys.lists(), { filters }],
  details: () => [...maintenanceQueryKeys.all(), 'detail'],
  detail: (id: number) => [...maintenanceQueryKeys.details(), id],
  stats: () => [...maintenanceQueryKeys.all(), 'stats'],
  attachments: (contractId: number) => [...maintenanceQueryKeys.all(), 'attachments', contractId],
  histories: (contractId: number) => [...maintenanceQueryKeys.all(), 'histories', contractId],
};

// ============================================================================
// useMaintenanceContractList
// ============================================================================

/**
 * 계약 목록 조회 with 필터, 정렬, 페이지네이션
 */
export function useMaintenanceContractList(
  filters?: ContractFilters,
  page: number = 1,
  limit: number = 20,
  sortBy?: string,
  order?: 'ASC' | 'DESC'
): UseQueryResult<ContractListResponse, Error> {
  return useQuery({
    queryKey: maintenanceQueryKeys.list(filters),
    queryFn: async () => {
      const params = new URLSearchParams();

      if (filters?.status) params.append('status', filters.status);
      if (filters?.customerId) params.append('customerId', filters.customerId.toString());
      if (filters?.assignedEmployeeId)
        params.append('assignedEmployeeId', filters.assignedEmployeeId.toString());
      if (filters?.contractNameSearch)
        params.append('contractNameSearch', filters.contractNameSearch);
      if (filters?.startDateFrom) params.append('startDateFrom', filters.startDateFrom.toString());
      if (filters?.startDateTo) params.append('startDateTo', filters.startDateTo.toString());
      if (filters?.endDateFrom) params.append('endDateFrom', filters.endDateFrom.toString());
      if (filters?.endDateTo) params.append('endDateTo', filters.endDateTo.toString());

      params.append('page', page.toString());
      params.append('limit', Math.min(limit, 50).toString());

      if (sortBy) params.append('sortBy', sortBy);
      if (order) params.append('order', order);

      return fetchAPI<ContractListResponse>(
        `/sunjin/api/maintenance?${params.toString()}`
      );
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

// ============================================================================
// useMaintenanceContractDetail
// ============================================================================

/**
 * 계약 상세 조회 (모든 관계 데이터 포함)
 */
export function useMaintenanceContractDetail(
  id: number | null
): UseQueryResult<ContractDetailResponse, Error> {
  return useQuery({
    queryKey: maintenanceQueryKeys.detail(id || 0),
    queryFn: async () => {
      return fetchAPI<ContractDetailResponse>(`/sunjin/api/maintenance/${id}`);
    },
    enabled: id !== null,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
  });
}

// ============================================================================
// useMaintenanceContractStats
// ============================================================================

/**
 * 계약 통계 조회
 */
export function useMaintenanceContractStats(): UseQueryResult<ContractStatsResponse, Error> {
  return useQuery({
    queryKey: maintenanceQueryKeys.stats(),
    queryFn: async () => {
      return fetchAPI<ContractStatsResponse>(`/sunjin/api/maintenance/stats`);
    },
    staleTime: 15 * 60 * 1000, // 15 minutes
    gcTime: 20 * 60 * 1000, // 20 minutes
  });
}

// ============================================================================
// useMaintenanceContractAttachments
// ============================================================================

/**
 * 계약 첨부파일 목록 조회
 */
export function useMaintenanceContractAttachments(
  contractId: number,
  page: number = 1,
  limit: number = 10
) {
  return useQuery({
    queryKey: maintenanceQueryKeys.attachments(contractId),
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: Math.min(limit, 50).toString(),
      });

      return fetchAPI(
        `/sunjin/api/maintenance/${contractId}/attachments?${params.toString()}`
      );
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

// ============================================================================
// useMaintenanceContractHistory
// ============================================================================

/**
 * 계약 변경 이력 조회
 */
export function useMaintenanceContractHistory(contractId: number, page: number = 1) {
  return useQuery({
    queryKey: maintenanceQueryKeys.histories(contractId),
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      });

      return fetchAPI(
        `/sunjin/api/maintenance/${contractId}/history?${params.toString()}`
      );
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

// ============================================================================
// useMaintenanceContractMutations
// ============================================================================

/**
 * 모든 계약 관련 뮤테이션
 */
export function useMaintenanceContractMutations() {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: async (data: CreateMaintenanceContractRequest) => {
      const response = await fetchAPI<{ data: MaintenanceContractDetail }>(
        '/sunjin/api/maintenance',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: maintenanceQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: maintenanceQueryKeys.stats() });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdateMaintenanceContractRequest }) => {
      const response = await fetchAPI<{ data: MaintenanceContractDetail }>(
        `/sunjin/api/maintenance/${id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        }
      );
      return response.data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: maintenanceQueryKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: maintenanceQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: maintenanceQueryKeys.stats() });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await fetchAPI(`/sunjin/api/maintenance/${id}`, { method: 'DELETE' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: maintenanceQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: maintenanceQueryKeys.stats() });
    },
  });

  const changeStatusMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: ChangeStatusRequest }) => {
      const response = await fetchAPI<{ data: MaintenanceContractDetail }>(
        `/sunjin/api/maintenance/${id}/status`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        }
      );
      return response.data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: maintenanceQueryKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: maintenanceQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: maintenanceQueryKeys.histories(id) });
    },
  });

  const uploadAttachmentMutation = useMutation({
    mutationFn: async ({
      contractId,
      file,
    }: {
      contractId: number;
      file: File;
    }) => {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetchAPI<{ id: number; file_name: string; file_size: number; created_at: string }>(
        `/sunjin/api/maintenance/${contractId}/attachments`,
        {
          method: 'POST',
          body: formData,
        }
      );
      return response;
    },
    onSuccess: (_, { contractId }) => {
      queryClient.invalidateQueries({ queryKey: maintenanceQueryKeys.attachments(contractId) });
      queryClient.invalidateQueries({ queryKey: maintenanceQueryKeys.detail(contractId) });
    },
  });

  const deleteAttachmentMutation = useMutation({
    mutationFn: async ({ contractId, attachmentId }: { contractId: number; attachmentId: number }) => {
      await fetchAPI(`/sunjin/api/maintenance/${contractId}/attachments/${attachmentId}`, { method: 'DELETE' });
    },
    onSuccess: (_, { contractId }) => {
      queryClient.invalidateQueries({ queryKey: maintenanceQueryKeys.attachments(contractId) });
      queryClient.invalidateQueries({ queryKey: maintenanceQueryKeys.detail(contractId) });
    },
  });

  return {
    createMutation,
    updateMutation,
    deleteMutation,
    changeStatusMutation,
    uploadAttachmentMutation,
    deleteAttachmentMutation,
  };
}
