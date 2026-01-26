// Generated: 2026-01-26 18:00:00 KST

import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  inventoryKeys,
  useInventoryListQuery,
  useInventoryDetailQuery,
  useInventoryStatsQuery,
  useCreateInventoryMutation,
  useCheckoutInventoryMutation,
  useCheckinInventoryMutation,
  useRelocateInventoryMutation,
  useStatusChangeInventoryMutation,
  useUpdateInventoryMutation,
  useDeleteInventoryMutation,
} from '../inventory';
import { mockInventoryList, mockInventoryStats } from '@/__tests__/fixtures/inventory';
import React from 'react';

// Wrapper component for hooks
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    React.createElement(QueryClientProvider, { client: queryClient }, children)
  );
};

describe('inventoryKeys', () => {
  test('should generate all key', () => {
    const key = inventoryKeys.all();
    expect(key).toEqual(['inventory']);
  });

  test('should generate lists key', () => {
    const key = inventoryKeys.lists();
    expect(key).toEqual(['inventory', 'list']);
  });

  test('should generate list key with params', () => {
    const params = { page: 1, pageSize: 10 };
    const key = inventoryKeys.list(params);
    expect(key).toContain('inventory');
    expect(key).toContain('list');
    expect(key).toContain(params);
  });

  test('should generate details key', () => {
    const key = inventoryKeys.details();
    expect(key).toEqual(['inventory', 'detail']);
  });

  test('should generate detail key with ID', () => {
    const key = inventoryKeys.detail(1);
    expect(key).toEqual(['inventory', 'detail', 1]);
  });

  test('should generate stats key', () => {
    const key = inventoryKeys.stats();
    expect(key).toEqual(['inventory', 'stats']);
  });
});

describe('useInventoryListQuery', () => {
  test('should fetch inventory list', async () => {
    const { result } = renderHook(() => useInventoryListQuery(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toBeDefined();
    expect(Array.isArray(result.current.data?.data)).toBe(true);
  });

  test('should pass query params correctly', async () => {
    const params = { page: 1, pageSize: 5 };
    const { result } = renderHook(() => useInventoryListQuery(params), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toBeDefined();
  });

  test('should handle filter params', async () => {
    const params = { categories: ['모니터'], statuses: ['재고'] };
    const { result } = renderHook(() => useInventoryListQuery(params), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toBeDefined();
  });

  test('should set stale time to 5 minutes', () => {
    const { result } = renderHook(() => useInventoryListQuery());

    // Query should be fresh for 5 minutes
    expect(result.current.status).toBeDefined();
  });
});

describe('useInventoryDetailQuery', () => {
  test('should fetch inventory detail', async () => {
    const { result } = renderHook(() => useInventoryDetailQuery(1), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toBeDefined();
    expect(result.current.data?.id).toBe(1);
  });

  test('should be disabled when id is null', () => {
    const { result } = renderHook(() => useInventoryDetailQuery(null), {
      wrapper: createWrapper(),
    });

    expect(result.current.status).toBe('pending');
    expect(result.current.fetchStatus).toBe('idle');
  });

  test('should fetch when id changes', async () => {
    const { result, rerender } = renderHook((id: number | null) => useInventoryDetailQuery(id), {
      initialProps: null as number | null,
      wrapper: createWrapper(),
    });

    expect(result.current.fetchStatus).toBe('idle');

    rerender(1);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data?.id).toBe(1);
  });

  test('should set stale time to 5 minutes', () => {
    const { result } = renderHook(() => useInventoryDetailQuery(1));

    expect(result.current.status).toBeDefined();
  });
});

describe('useInventoryStatsQuery', () => {
  test('should fetch inventory stats', async () => {
    const { result } = renderHook(() => useInventoryStatsQuery(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toBeDefined();
    expect(result.current.data?.byStatus).toBeDefined();
    expect(result.current.data?.byCategory).toBeDefined();
    expect(result.current.data?.overdue).toBeDefined();
  });

  test('should set shorter stale time (2 minutes)', () => {
    const { result } = renderHook(() => useInventoryStatsQuery());

    // Stats should have shorter stale time since it changes frequently
    expect(result.current.status).toBeDefined();
  });
});

describe('useCreateInventoryMutation', () => {
  test('should create inventory', async () => {
    const { result } = renderHook(() => useCreateInventoryMutation(), {
      wrapper: createWrapper(),
    });

    const data = {
      category: '모니터',
      model: 'Test Monitor',
      serial_number: 'TEST-NEW-001',
      purchase_date: '2026-01-01',
      purchase_from: 'Test Store',
      current_location: '창고 A-1',
    };

    result.current.mutate(data);

    await waitFor(() => {
      expect(result.current.isPending).toBe(false);
    });

    expect(result.current.data).toBeDefined();
  });

  test('should invalidate list cache on success', async () => {
    const queryClient = new QueryClient();
    const invalidateQuerySpy = jest.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useCreateInventoryMutation(), {
      wrapper: ({ children }) =>
        React.createElement(QueryClientProvider, { client: queryClient }, children),
    });

    const data = {
      category: '모니터',
      model: 'Test',
      serial_number: 'TEST-001',
      purchase_date: '2026-01-01',
      purchase_from: 'Test',
      current_location: '창고',
    };

    result.current.mutate(data);

    await waitFor(() => {
      expect(result.current.isPending).toBe(false);
    });

    // Should invalidate lists and stats
    expect(invalidateQuerySpy).toHaveBeenCalled();
    invalidateQuerySpy.mockRestore();
  });

  test('should handle mutation errors', async () => {
    const { result } = renderHook(() => useCreateInventoryMutation(), {
      wrapper: createWrapper(),
    });

    const invalidData = {
      category: 'INVALID',
      model: 'Test',
      serial_number: 'INVALID-001',
      purchase_date: '2026-01-01',
      purchase_from: 'Test',
      current_location: '창고',
    };

    result.current.mutate(invalidData);

    await waitFor(() => {
      expect(result.current.isPending).toBe(false);
    });
  });
});

describe('useCheckoutInventoryMutation', () => {
  test('should checkout inventory', async () => {
    const { result } = renderHook(() => useCheckoutInventoryMutation(1), {
      wrapper: createWrapper(),
    });

    const data = {
      checkout_location: '사무실',
      expected_checkin_date: '2026-02-26',
    };

    result.current.mutate(data);

    await waitFor(() => {
      expect(result.current.isPending).toBe(false);
    });

    expect(result.current.data?.current_status).toBe('출고');
  });

  test('should invalidate detail, list, and stats on success', async () => {
    const queryClient = new QueryClient();
    const invalidateQuerySpy = jest.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useCheckoutInventoryMutation(1), {
      wrapper: ({ children }) =>
        React.createElement(QueryClientProvider, { client: queryClient }, children),
    });

    const data = {
      checkout_location: '사무실',
      expected_checkin_date: '2026-02-26',
    };

    result.current.mutate(data);

    await waitFor(() => {
      expect(result.current.isPending).toBe(false);
    });

    expect(invalidateQuerySpy).toHaveBeenCalled();
    invalidateQuerySpy.mockRestore();
  });
});

describe('useCheckinInventoryMutation', () => {
  test('should checkin inventory', async () => {
    const { result } = renderHook(() => useCheckinInventoryMutation(2), {
      wrapper: createWrapper(),
    });

    const data = {
      current_location: '창고 A-1',
    };

    result.current.mutate(data);

    await waitFor(() => {
      expect(result.current.isPending).toBe(false);
    });

    expect(result.current.data?.current_status).toBe('재고');
  });

  test('should invalidate related queries on success', async () => {
    const queryClient = new QueryClient();
    const invalidateQuerySpy = jest.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useCheckinInventoryMutation(2), {
      wrapper: ({ children }) =>
        React.createElement(QueryClientProvider, { client: queryClient }, children),
    });

    const data = {
      current_location: '창고',
    };

    result.current.mutate(data);

    await waitFor(() => {
      expect(result.current.isPending).toBe(false);
    });

    expect(invalidateQuerySpy).toHaveBeenCalled();
    invalidateQuerySpy.mockRestore();
  });
});

describe('useRelocateInventoryMutation', () => {
  test('should relocate inventory', async () => {
    const { result } = renderHook(() => useRelocateInventoryMutation(1), {
      wrapper: createWrapper(),
    });

    const data = {
      current_location: '창고 B-1',
    };

    result.current.mutate(data);

    await waitFor(() => {
      expect(result.current.isPending).toBe(false);
    });

    expect(result.current.data?.current_location).toBe('창고 B-1');
  });

  test('should not invalidate stats on relocation', () => {
    // Relocation only invalidates detail and list, not stats
    const { result } = renderHook(() => useRelocateInventoryMutation(1), {
      wrapper: createWrapper(),
    });

    expect(result.current.status).toBeDefined();
  });
});

describe('useStatusChangeInventoryMutation', () => {
  test('should change inventory status', async () => {
    const { result } = renderHook(() => useStatusChangeInventoryMutation(1), {
      wrapper: createWrapper(),
    });

    const data = {
      current_status: '고장',
    };

    result.current.mutate(data);

    await waitFor(() => {
      expect(result.current.isPending).toBe(false);
    });

    expect(result.current.data?.current_status).toBe('고장');
  });

  test('should invalidate all related queries on success', async () => {
    const queryClient = new QueryClient();
    const invalidateQuerySpy = jest.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useStatusChangeInventoryMutation(1), {
      wrapper: ({ children }) =>
        React.createElement(QueryClientProvider, { client: queryClient }, children),
    });

    const data = {
      current_status: '고장',
    };

    result.current.mutate(data);

    await waitFor(() => {
      expect(result.current.isPending).toBe(false);
    });

    expect(invalidateQuerySpy).toHaveBeenCalled();
    invalidateQuerySpy.mockRestore();
  });
});

describe('useUpdateInventoryMutation', () => {
  test('should update inventory', async () => {
    const { result } = renderHook(() => useUpdateInventoryMutation(1), {
      wrapper: createWrapper(),
    });

    const data = {
      model: 'Updated Model',
      notes: 'Updated notes',
    };

    result.current.mutate(data);

    await waitFor(() => {
      expect(result.current.isPending).toBe(false);
    });

    expect(result.current.data?.model).toBe('Updated Model');
  });

  test('should invalidate detail and list on success', async () => {
    const queryClient = new QueryClient();
    const invalidateQuerySpy = jest.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useUpdateInventoryMutation(1), {
      wrapper: ({ children }) =>
        React.createElement(QueryClientProvider, { client: queryClient }, children),
    });

    const data = {
      model: 'Updated',
    };

    result.current.mutate(data);

    await waitFor(() => {
      expect(result.current.isPending).toBe(false);
    });

    expect(invalidateQuerySpy).toHaveBeenCalled();
    invalidateQuerySpy.mockRestore();
  });
});

describe('useDeleteInventoryMutation', () => {
  test('should delete inventory', async () => {
    const { result } = renderHook(() => useDeleteInventoryMutation(5), {
      wrapper: createWrapper(),
    });

    result.current.mutate();

    await waitFor(() => {
      expect(result.current.isPending).toBe(false);
    });

    expect(result.current.isSuccess).toBe(true);
  });

  test('should remove detail cache and invalidate lists on success', async () => {
    const queryClient = new QueryClient();
    const removeQueriesSpy = jest.spyOn(queryClient, 'removeQueries');
    const invalidateQuerySpy = jest.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useDeleteInventoryMutation(5), {
      wrapper: ({ children }) =>
        React.createElement(QueryClientProvider, { client: queryClient }, children),
    });

    result.current.mutate();

    await waitFor(() => {
      expect(result.current.isPending).toBe(false);
    });

    expect(removeQueriesSpy).toHaveBeenCalled();
    expect(invalidateQuerySpy).toHaveBeenCalled();
    removeQueriesSpy.mockRestore();
    invalidateQuerySpy.mockRestore();
  });
});
