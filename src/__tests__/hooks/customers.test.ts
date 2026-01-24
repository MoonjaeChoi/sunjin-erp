// Generated: 2026-01-25 06:40:00 KST

import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useCustomerListQuery } from '@/hooks/customers';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

describe('useCustomerListQuery', () => {
  const mockFetch = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = mockFetch;
  });

  it('should fetch customer list', async () => {
    const mockData = { customers: [{ id: 1, name: '삼성전자', category: 'END_USER' }] };
    mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve(mockData) });

    const { result } = renderHook(() => useCustomerListQuery(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockData);
    expect(mockFetch).toHaveBeenCalledWith('/api/customers/list');
  });

  it('should throw on error response', async () => {
    mockFetch.mockResolvedValue({ ok: false });

    const { result } = renderHook(() => useCustomerListQuery(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
