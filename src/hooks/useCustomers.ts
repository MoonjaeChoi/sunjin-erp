// Generated: 2026-01-28 00:35:00 KST

'use client';

import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryResult,
  UseMutationResult,
} from '@tanstack/react-query';
import {
  Customer,
  CustomerResponse,
  CustomerListResponse,
  CustomerListItem,
  CustomerDetailResponse,
  CustomerContact,
  CustomerContactResponse,
  CustomerContactListResponse,
  CustomerHistory,
  CustomerHistoryResponse,
  CustomerHistoryListResponse,
  CreateCustomerRequest,
  UpdateCustomerRequest,
  CreateCustomerContactRequest,
  UpdateCustomerContactRequest,
  CustomerListQueryParams,
  CustomerHistoryQueryParams,
  CustomerDeleteResponse,
  CustomerContactDeleteResponse,
} from '@/types/customer';

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

const customerQueryKeys = {
  all: () => ['customers'],
  lists: () => [...customerQueryKeys.all(), 'list'],
  list: (filters?: CustomerListQueryParams) => [...customerQueryKeys.lists(), { filters }],
  searches: () => [...customerQueryKeys.all(), 'search'],
  search: (query: string) => [...customerQueryKeys.searches(), query],
  details: () => [...customerQueryKeys.all(), 'detail'],
  detail: (id: number) => [...customerQueryKeys.details(), id],
  contacts: (customerId: number) => [...customerQueryKeys.all(), 'contacts', customerId],
  histories: (customerId: number) => [...customerQueryKeys.all(), 'histories', customerId],
};

// ============================================================================
// useCustomers - List with Filters, Sorting, Pagination
// ============================================================================

/**
 * 고객 목록 조회 with 필터, 정렬, 페이지네이션
 */
export function useCustomers(
  params?: CustomerListQueryParams
): UseQueryResult<CustomerListResponse, Error> {
  return useQuery({
    queryKey: customerQueryKeys.list(params),
    queryFn: async () => {
      const urlParams = new URLSearchParams();

      if (params?.page) urlParams.append('page', params.page.toString());
      if (params?.limit) urlParams.append('limit', params.limit.toString());
      if (params?.search) urlParams.append('search', params.search);
      if (params?.classification?.length) {
        params.classification.forEach((c) => urlParams.append('classification', c));
      }
      if (params?.managerId) urlParams.append('managerId', params.managerId.toString());
      if (params?.includeDeleted) urlParams.append('includeDeleted', 'true');
      if (params?.sortBy) urlParams.append('sortBy', params.sortBy);
      if (params?.sortOrder) urlParams.append('sortOrder', params.sortOrder);

      return fetchAPI<CustomerListResponse>(`/sunjin/api/customers?${urlParams.toString()}`);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
}

// ============================================================================
// useCustomer - Single Customer Detail
// ============================================================================

/**
 * 고객 상세 조회
 */
export function useCustomer(id: number | null): UseQueryResult<CustomerDetailResponse, Error> {
  return useQuery({
    queryKey: customerQueryKeys.detail(id || 0),
    queryFn: async () => {
      const response = await fetchAPI<{ data: CustomerDetailResponse }>(`/sunjin/api/customers/${id}`);
      return response.data;
    },
    enabled: id !== null,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
}

// ============================================================================
// useCustomerSearch - Customer Search/Autocomplete
// ============================================================================

/**
 * 고객 검색 (자동 완성용)
 */
export function useCustomerSearch(
  query: string,
  limit: number = 10
): UseQueryResult<CustomerListItem[], Error> {
  return useQuery({
    queryKey: customerQueryKeys.search(query),
    queryFn: async () => {
      const params = new URLSearchParams({
        search: query,
        limit: Math.min(limit, 50).toString(),
      });

      const response = await fetchAPI<CustomerListResponse>(
        `/sunjin/api/customers?${params.toString()}`
      );
      return response.data;
    },
    enabled: query.length > 0,
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

// ============================================================================
// useCustomerContacts - Customer Contacts List
// ============================================================================

/**
 * 고객 담당자 목록 조회
 */
export function useCustomerContacts(
  customerId: number | null
): UseQueryResult<CustomerContactListResponse, Error> {
  return useQuery({
    queryKey: customerQueryKeys.contacts(customerId || 0),
    queryFn: async () => {
      return fetchAPI<CustomerContactListResponse>(
        `/sunjin/api/customers/${customerId}/contacts`
      );
    },
    enabled: customerId !== null,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
  });
}

// ============================================================================
// useCustomerHistory - Customer History List
// ============================================================================

/**
 * 고객 변경 이력 조회 with 필터, 정렬, 페이지네이션
 */
export function useCustomerHistory(
  customerId: number | null,
  params?: CustomerHistoryQueryParams
): UseQueryResult<CustomerHistoryListResponse, Error> {
  return useQuery({
    queryKey: customerQueryKeys.histories(customerId || 0),
    queryFn: async () => {
      const urlParams = new URLSearchParams();

      if (params?.page) urlParams.append('page', params.page.toString());
      if (params?.limit) urlParams.append('limit', params.limit.toString());
      if (params?.changeType) urlParams.append('changeType', params.changeType);
      if (params?.fromDate) urlParams.append('fromDate', params.fromDate);
      if (params?.toDate) urlParams.append('toDate', params.toDate);
      if (params?.sortBy) urlParams.append('sortBy', params.sortBy);
      if (params?.sortOrder) urlParams.append('sortOrder', params.sortOrder);

      return fetchAPI<CustomerHistoryListResponse>(
        `/sunjin/api/customers/${customerId}/history?${urlParams.toString()}`
      );
    },
    enabled: customerId !== null,
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 60 * 60 * 1000, // 60 minutes
  });
}

// ============================================================================
// useCustomerMutations - All Customer Related Mutations
// ============================================================================

/**
 * 고객 및 담당자 관련 모든 뮤테이션
 */
export function useCustomerMutations() {
  const queryClient = useQueryClient();

  // ========== Customer Mutations ==========

  const createCustomerMutation = useMutation({
    mutationFn: async (data: CreateCustomerRequest) => {
      const response = await fetchAPI<{ data: CustomerResponse; message: string }>(
        '/sunjin/api/customers',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        }
      );
      return response.data;
    },
    onSuccess: (newCustomer) => {
      // Invalidate list and searches
      queryClient.invalidateQueries({ queryKey: customerQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: customerQueryKeys.searches() });
      // Set detail cache
      queryClient.setQueryData(customerQueryKeys.detail(newCustomer.id), newCustomer);
    },
  });

  const updateCustomerMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdateCustomerRequest }) => {
      const response = await fetchAPI<{ data: CustomerResponse; message: string }>(
        `/sunjin/api/customers/${id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        }
      );
      return response.data;
    },
    onSuccess: (updatedCustomer, { id }) => {
      // Invalidate list and detail
      queryClient.invalidateQueries({ queryKey: customerQueryKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: customerQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: customerQueryKeys.searches() });
      // Invalidate history since customer was updated
      queryClient.invalidateQueries({ queryKey: customerQueryKeys.histories(id) });
    },
  });

  const deleteCustomerMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetchAPI<{ data: CustomerDeleteResponse; message: string }>(
        `/sunjin/api/customers/${id}`,
        { method: 'DELETE' }
      );
      return response.data;
    },
    onSuccess: (_, id) => {
      // Invalidate list and detail
      queryClient.invalidateQueries({ queryKey: customerQueryKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: customerQueryKeys.lists() });
      queryClient.invalidateQueries({ queryKey: customerQueryKeys.searches() });
    },
  });

  // ========== Contact Mutations ==========

  const createContactMutation = useMutation({
    mutationFn: async ({
      customerId,
      data,
    }: {
      customerId: number;
      data: CreateCustomerContactRequest;
    }) => {
      const response = await fetchAPI<{ data: CustomerContactResponse; message: string }>(
        `/sunjin/api/customers/${customerId}/contacts`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        }
      );
      return response.data;
    },
    onSuccess: (_, { customerId }) => {
      // Invalidate customer detail and contacts list
      queryClient.invalidateQueries({ queryKey: customerQueryKeys.detail(customerId) });
      queryClient.invalidateQueries({ queryKey: customerQueryKeys.contacts(customerId) });
      // Invalidate history since contact was added
      queryClient.invalidateQueries({ queryKey: customerQueryKeys.histories(customerId) });
    },
  });

  const updateContactMutation = useMutation({
    mutationFn: async ({
      customerId,
      contactId,
      data,
    }: {
      customerId: number;
      contactId: number;
      data: UpdateCustomerContactRequest;
    }) => {
      const response = await fetchAPI<{ data: CustomerContactResponse; message: string }>(
        `/sunjin/api/customers/${customerId}/contacts/${contactId}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        }
      );
      return response.data;
    },
    onSuccess: (_, { customerId }) => {
      // Invalidate customer detail and contacts list
      queryClient.invalidateQueries({ queryKey: customerQueryKeys.detail(customerId) });
      queryClient.invalidateQueries({ queryKey: customerQueryKeys.contacts(customerId) });
      // Invalidate history since contact was updated
      queryClient.invalidateQueries({ queryKey: customerQueryKeys.histories(customerId) });
    },
  });

  const deleteContactMutation = useMutation({
    mutationFn: async ({
      customerId,
      contactId,
    }: {
      customerId: number;
      contactId: number;
    }) => {
      const response = await fetchAPI<{
        data: CustomerContactDeleteResponse;
        message: string;
      }>(`/sunjin/api/customers/${customerId}/contacts/${contactId}`, { method: 'DELETE' });
      return response.data;
    },
    onSuccess: (_, { customerId }) => {
      // Invalidate customer detail and contacts list
      queryClient.invalidateQueries({ queryKey: customerQueryKeys.detail(customerId) });
      queryClient.invalidateQueries({ queryKey: customerQueryKeys.contacts(customerId) });
      // Invalidate history since contact was deleted
      queryClient.invalidateQueries({ queryKey: customerQueryKeys.histories(customerId) });
    },
  });

  // ========== Return all mutations ==========

  return {
    createCustomerMutation,
    updateCustomerMutation,
    deleteCustomerMutation,
    createContactMutation,
    updateContactMutation,
    deleteContactMutation,
  };
}

// ============================================================================
// Convenience Hooks for Individual Mutations
// ============================================================================

/**
 * Create customer mutation only
 */
export function useCreateCustomer(): UseMutationResult<
  CustomerResponse,
  Error,
  CreateCustomerRequest
> {
  const { createCustomerMutation } = useCustomerMutations();
  return createCustomerMutation;
}

/**
 * Update customer mutation only
 */
export function useUpdateCustomer(): UseMutationResult<
  CustomerResponse,
  Error,
  { id: number; data: UpdateCustomerRequest }
> {
  const { updateCustomerMutation } = useCustomerMutations();
  return updateCustomerMutation;
}

/**
 * Delete customer mutation only
 */
export function useDeleteCustomer(): UseMutationResult<
  CustomerDeleteResponse,
  Error,
  number
> {
  const { deleteCustomerMutation } = useCustomerMutations();
  return deleteCustomerMutation;
}

/**
 * Create contact mutation only
 */
export function useCreateCustomerContact(): UseMutationResult<
  CustomerContactResponse,
  Error,
  { customerId: number; data: CreateCustomerContactRequest }
> {
  const { createContactMutation } = useCustomerMutations();
  return createContactMutation;
}

/**
 * Update contact mutation only
 */
export function useUpdateCustomerContact(): UseMutationResult<
  CustomerContactResponse,
  Error,
  { customerId: number; contactId: number; data: UpdateCustomerContactRequest }
> {
  const { updateContactMutation } = useCustomerMutations();
  return updateContactMutation;
}

/**
 * Delete contact mutation only
 */
export function useDeleteCustomerContact(): UseMutationResult<
  CustomerContactDeleteResponse,
  Error,
  { customerId: number; contactId: number }
> {
  const { deleteContactMutation } = useCustomerMutations();
  return deleteContactMutation;
}
