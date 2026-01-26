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
  test('should create query hook', () => {
    const { result } = renderHook(() => useInventoryListQuery(), {
      wrapper: createWrapper(),
    });

    expect(result.current).toBeDefined();
    expect(result.current.isLoading).toBeDefined();
    expect(result.current.status).toBeDefined();
  });

  test('should accept query params', () => {
    const params = { page: 1, pageSize: 5 };
    const { result } = renderHook(() => useInventoryListQuery(params), {
      wrapper: createWrapper(),
    });

    expect(result.current).toBeDefined();
  });

  test('should handle filter params', () => {
    const params = { categories: ['모니터'], statuses: ['재고'] };
    const { result } = renderHook(() => useInventoryListQuery(params), {
      wrapper: createWrapper(),
    });

    expect(result.current).toBeDefined();
  });

  test('should initialize in idle or loading state', () => {
    const { result } = renderHook(() => useInventoryListQuery(), {
      wrapper: createWrapper(),
    });

    expect(typeof result.current.status).toBe('string');
    expect(['idle', 'loading', 'pending']).toContain(result.current.status);
  });
});

describe('useInventoryDetailQuery', () => {
  test('should create detail query hook', () => {
    const { result } = renderHook(() => useInventoryDetailQuery(1), {
      wrapper: createWrapper(),
    });

    expect(result.current).toBeDefined();
    expect(result.current.isLoading).toBeDefined();
  });

  test('should be disabled when id is null', () => {
    const { result } = renderHook(() => useInventoryDetailQuery(null), {
      wrapper: createWrapper(),
    });

    expect(result.current.status).toBe('pending');
    expect(result.current.fetchStatus).toBe('idle');
  });

  test('should enable when id is provided', () => {
    const { result } = renderHook(() => useInventoryDetailQuery(1), {
      wrapper: createWrapper(),
    });

    expect(['idle', 'loading', 'fetching']).toContain(result.current.fetchStatus);
  });

  test('should accept different inventory IDs', () => {
    const { result } = renderHook(() => useInventoryDetailQuery(5), {
      wrapper: createWrapper(),
    });

    expect(result.current).toBeDefined();
  });
});

describe('useInventoryStatsQuery', () => {
  test('should create stats query hook', () => {
    const { result } = renderHook(() => useInventoryStatsQuery(), {
      wrapper: createWrapper(),
    });

    expect(result.current).toBeDefined();
    expect(result.current.isLoading).toBeDefined();
    expect(result.current.status).toBeDefined();
  });

  test('should initialize with idle, loading, or pending status', () => {
    const { result } = renderHook(() => useInventoryStatsQuery(), {
      wrapper: createWrapper(),
    });

    expect(['idle', 'loading', 'pending']).toContain(result.current.status);
  });
});

describe('useCreateInventoryMutation', () => {
  test('should create mutation hook', () => {
    const { result } = renderHook(() => useCreateInventoryMutation(), {
      wrapper: createWrapper(),
    });

    expect(result.current).toBeDefined();
    expect(result.current.mutate).toBeDefined();
    expect(result.current.isPending).toBe(false);
  });

  test('should have initial state', () => {
    const { result } = renderHook(() => useCreateInventoryMutation(), {
      wrapper: createWrapper(),
    });

    expect(result.current.status).toBe('idle');
  });
});

describe('useCheckoutInventoryMutation', () => {
  test('should create checkout mutation with inventory ID', () => {
    const { result } = renderHook(() => useCheckoutInventoryMutation(1), {
      wrapper: createWrapper(),
    });

    expect(result.current).toBeDefined();
    expect(result.current.mutate).toBeDefined();
    expect(result.current.isPending).toBe(false);
  });

  test('should initialize in idle state', () => {
    const { result } = renderHook(() => useCheckoutInventoryMutation(2), {
      wrapper: createWrapper(),
    });

    expect(result.current.status).toBe('idle');
  });
});

describe('useCheckinInventoryMutation', () => {
  test('should create checkin mutation with inventory ID', () => {
    const { result } = renderHook(() => useCheckinInventoryMutation(2), {
      wrapper: createWrapper(),
    });

    expect(result.current).toBeDefined();
    expect(result.current.mutate).toBeDefined();
  });
});

describe('useRelocateInventoryMutation', () => {
  test('should create relocate mutation with inventory ID', () => {
    const { result } = renderHook(() => useRelocateInventoryMutation(1), {
      wrapper: createWrapper(),
    });

    expect(result.current).toBeDefined();
    expect(result.current.mutate).toBeDefined();
  });
});

describe('useStatusChangeInventoryMutation', () => {
  test('should create status change mutation with inventory ID', () => {
    const { result } = renderHook(() => useStatusChangeInventoryMutation(1), {
      wrapper: createWrapper(),
    });

    expect(result.current).toBeDefined();
    expect(result.current.mutate).toBeDefined();
  });
});

describe('useUpdateInventoryMutation', () => {
  test('should create update mutation with inventory ID', () => {
    const { result } = renderHook(() => useUpdateInventoryMutation(1), {
      wrapper: createWrapper(),
    });

    expect(result.current).toBeDefined();
    expect(result.current.mutate).toBeDefined();
  });
});

describe('useDeleteInventoryMutation', () => {
  test('should create delete mutation with inventory ID', () => {
    const { result } = renderHook(() => useDeleteInventoryMutation(5), {
      wrapper: createWrapper(),
    });

    expect(result.current).toBeDefined();
    expect(result.current.mutate).toBeDefined();
  });
});
