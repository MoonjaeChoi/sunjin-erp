// Generated: 2026-01-26 14:50:00 KST

'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  InventoryRecord,
  InventoryDetail,
  InventoryListResponse,
  InventoryStats,
  CreateInventoryRequest,
  CheckoutInventoryRequest,
  CheckinInventoryRequest,
  RelocateInventoryRequest,
  StatusChangeInventoryRequest,
  UpdateInventoryRequest,
  InventoryQueryParams,
} from '@/types/inventory';

/**
 * Query Key Factory
 */
export const inventoryKeys = {
  all: () => ['inventory'] as const,
  lists: () => [...inventoryKeys.all(), 'list'] as const,
  list: (params: Partial<InventoryQueryParams>) => [...inventoryKeys.lists(), params] as const,
  details: () => [...inventoryKeys.all(), 'detail'] as const,
  detail: (id: number) => [...inventoryKeys.details(), id] as const,
  stats: () => [...inventoryKeys.all(), 'stats'] as const,
};

/**
 * API Utility Functions
 */

async function fetchInventoryList(
  params: Partial<InventoryQueryParams>
): Promise<InventoryListResponse> {
  const queryString = new URLSearchParams();

  if (params.page) queryString.append('page', params.page.toString());
  if (params.pageSize) queryString.append('pageSize', params.pageSize.toString());
  if (params.categories?.length) {
    params.categories.forEach((cat) => queryString.append('categories', cat));
  }
  if (params.statuses?.length) {
    params.statuses.forEach((status) => queryString.append('statuses', status));
  }
  if (params.location) queryString.append('location', params.location);
  if (params.search) queryString.append('search', params.search);
  if (params.sortBy) queryString.append('sortBy', params.sortBy);
  if (params.order) queryString.append('order', params.order);

  const response = await fetch(`/api/inventory?${queryString}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch inventory list: ${response.statusText}`);
  }

  return response.json();
}

async function fetchInventoryDetail(id: number): Promise<InventoryDetail> {
  const response = await fetch(`/api/inventory/${id}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch inventory detail: ${response.statusText}`);
  }

  return response.json();
}

async function fetchInventoryStats(): Promise<InventoryStats> {
  const response = await fetch('/api/inventory/stats', {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch inventory stats: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Query Hooks
 */

export function useInventoryListQuery(
  params: Partial<InventoryQueryParams> = {},
  options?: any
) {
  return useQuery({
    queryKey: inventoryKeys.list(params),
    queryFn: () => fetchInventoryList(params),
    staleTime: 1000 * 60 * 5, // 5분
    gcTime: 1000 * 60 * 30, // 30분
    ...options,
  });
}

export function useInventoryDetailQuery(id: number | null, options?: any) {
  return useQuery({
    queryKey: inventoryKeys.detail(id || 0),
    queryFn: () => fetchInventoryDetail(id!),
    staleTime: 1000 * 60 * 5, // 5분
    gcTime: 1000 * 60 * 30, // 30분
    enabled: !!id,
    ...options,
  });
}

export function useInventoryStatsQuery(options?: any) {
  return useQuery({
    queryKey: inventoryKeys.stats(),
    queryFn: () => fetchInventoryStats(),
    staleTime: 1000 * 60 * 2, // 2분 (자주 변함)
    gcTime: 1000 * 60 * 30, // 30분
    ...options,
  });
}

/**
 * Mutation Hooks
 */

export function useCreateInventoryMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateInventoryRequest) => {
      const response = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`Failed to create inventory: ${response.statusText}`);
      }

      return response.json() as Promise<InventoryRecord>;
    },
    onSuccess: () => {
      // 목록과 통계 캐시 무효화
      queryClient.invalidateQueries({ queryKey: inventoryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.stats() });
    },
  });
}

export function useCheckoutInventoryMutation(id: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CheckoutInventoryRequest) => {
      const response = await fetch(`/api/inventory/${id}/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`Failed to checkout inventory: ${response.statusText}`);
      }

      return response.json() as Promise<InventoryRecord>;
    },
    onSuccess: () => {
      // 상세, 목록, 통계 캐시 무효화
      queryClient.invalidateQueries({ queryKey: inventoryKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.stats() });
    },
  });
}

export function useCheckinInventoryMutation(id: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CheckinInventoryRequest) => {
      const response = await fetch(`/api/inventory/${id}/checkin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`Failed to checkin inventory: ${response.statusText}`);
      }

      return response.json() as Promise<InventoryRecord>;
    },
    onSuccess: () => {
      // 상세, 목록, 통계 캐시 무효화 (과기 상태 변경 가능)
      queryClient.invalidateQueries({ queryKey: inventoryKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.stats() });
    },
  });
}

export function useRelocateInventoryMutation(id: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: RelocateInventoryRequest) => {
      const response = await fetch(`/api/inventory/${id}/relocate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`Failed to relocate inventory: ${response.statusText}`);
      }

      return response.json() as Promise<InventoryRecord>;
    },
    onSuccess: () => {
      // 상세와 목록 캐시 무효화 (위치만 변경)
      queryClient.invalidateQueries({ queryKey: inventoryKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.lists() });
    },
  });
}

export function useStatusChangeInventoryMutation(id: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: StatusChangeInventoryRequest) => {
      const response = await fetch(`/api/inventory/${id}/status-change`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`Failed to change inventory status: ${response.statusText}`);
      }

      return response.json() as Promise<InventoryRecord>;
    },
    onSuccess: () => {
      // 모든 캐시 무효화 (상태 변경은 영향이 큼)
      queryClient.invalidateQueries({ queryKey: inventoryKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.stats() });
    },
  });
}

export function useUpdateInventoryMutation(id: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateInventoryRequest) => {
      const response = await fetch(`/api/inventory/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`Failed to update inventory: ${response.statusText}`);
      }

      return response.json() as Promise<InventoryRecord>;
    },
    onSuccess: () => {
      // 상세와 목록 캐시 무효화
      queryClient.invalidateQueries({ queryKey: inventoryKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.lists() });
    },
  });
}

export function useDeleteInventoryMutation(id: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/inventory/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`Failed to delete inventory: ${response.statusText}`);
      }

      return response.json();
    },
    onSuccess: () => {
      // 상세 제거, 목록과 통계 무효화
      queryClient.removeQueries({ queryKey: inventoryKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.stats() });
    },
  });
}
