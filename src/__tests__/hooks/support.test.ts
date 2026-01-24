// Generated: 2026-01-25 06:40:00 KST

import { renderHook, waitFor, act } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  useTechSupportSearchQuery,
  useTechSupportDetailQuery,
  useCreateTechSupportMutation,
  useUpdateTechSupportMutation,
  useDeleteTechSupportMutation,
  useUploadAttachmentMutation,
  useDeleteAttachmentMutation,
} from '@/hooks/support';
import { TechSupportSearchParams } from '@/types/tech-support';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

describe('useTechSupportSearchQuery', () => {
  const mockFetch = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = mockFetch;
  });

  const validParams: TechSupportSearchParams = {
    date_from: '2026-01-01',
    date_to: '2026-01-31',
    page: 1,
    page_size: 20,
    sort_by: 'support_date',
    sort_order: 'DESC',
  };

  it('should fetch with valid params', async () => {
    const mockData = { supports: [{ id: 1 }], total: 1, page: 1, page_size: 20 };
    mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve(mockData) });

    const { result } = renderHook(() => useTechSupportSearchQuery(validParams), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockData);
    expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/api/support?'));
  });

  it('should not fetch when date_from is empty', () => {
    const params = { ...validParams, date_from: '' };
    const { result } = renderHook(() => useTechSupportSearchQuery(params), {
      wrapper: createWrapper(),
    });
    expect(result.current.fetchStatus).toBe('idle');
  });

  it('should not fetch when date_to is empty', () => {
    const params = { ...validParams, date_to: '' };
    const { result } = renderHook(() => useTechSupportSearchQuery(params), {
      wrapper: createWrapper(),
    });
    expect(result.current.fetchStatus).toBe('idle');
  });

  it('should include optional filters in URL', async () => {
    mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve({ supports: [], total: 0, page: 1, page_size: 20 }) });
    const params: TechSupportSearchParams = {
      ...validParams,
      customer_id: 5,
      support_type: 'INSTALL',
      status: 'RECEIVED',
      keyword: '테스트',
    };

    const { result } = renderHook(() => useTechSupportSearchQuery(params), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toContain('customer_id=5');
    expect(url).toContain('support_type=INSTALL');
    expect(url).toContain('status=RECEIVED');
  });

  it('should throw on error response', async () => {
    mockFetch.mockResolvedValue({ ok: false });
    const { result } = renderHook(() => useTechSupportSearchQuery(validParams), {
      wrapper: createWrapper(),
    });
    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe('useTechSupportDetailQuery', () => {
  const mockFetch = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = mockFetch;
  });

  it('should fetch detail when id is provided', async () => {
    const mockData = { id: 1, title: 'Test' };
    mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve(mockData) });

    const { result } = renderHook(() => useTechSupportDetailQuery(1), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockFetch).toHaveBeenCalledWith('/api/support/1');
  });

  it('should not fetch when id is null', () => {
    const { result } = renderHook(() => useTechSupportDetailQuery(null), {
      wrapper: createWrapper(),
    });
    expect(result.current.fetchStatus).toBe('idle');
  });
});

describe('useCreateTechSupportMutation', () => {
  const mockFetch = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = mockFetch;
  });

  it('should call POST /api/support', async () => {
    mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve({ id: 1 }) });

    const { result } = renderHook(() => useCreateTechSupportMutation(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.mutateAsync({
        title: 'Test',
        customer_id: 1,
        support_type: 'INSTALL',
        support_date: '2026-01-15',
      });
    });

    expect(mockFetch).toHaveBeenCalledWith('/api/support', expect.objectContaining({
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }));
  });

  it('should throw on error response', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: 'Validation failed' }),
    });

    const { result } = renderHook(() => useCreateTechSupportMutation(), {
      wrapper: createWrapper(),
    });

    await expect(
      act(async () => {
        await result.current.mutateAsync({
          title: '',
          customer_id: 1,
          support_type: 'INSTALL',
          support_date: '2026-01-15',
        });
      })
    ).rejects.toThrow();
  });
});

describe('useUpdateTechSupportMutation', () => {
  const mockFetch = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = mockFetch;
  });

  it('should call PUT /api/support/[id]', async () => {
    mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve({ id: 1 }) });

    const { result } = renderHook(() => useUpdateTechSupportMutation(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.mutateAsync({ id: 1, data: { title: 'Updated' } });
    });

    expect(mockFetch).toHaveBeenCalledWith('/api/support/1', expect.objectContaining({
      method: 'PUT',
    }));
  });

  it('should propagate error message', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: 'Invalid status transition' }),
    });

    const { result } = renderHook(() => useUpdateTechSupportMutation(), {
      wrapper: createWrapper(),
    });

    await expect(
      act(async () => {
        await result.current.mutateAsync({ id: 1, data: { status: 'COMPLETED' } });
      })
    ).rejects.toThrow('Invalid status transition');
  });
});

describe('useDeleteTechSupportMutation', () => {
  const mockFetch = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = mockFetch;
  });

  it('should call DELETE /api/support/[id]', async () => {
    mockFetch.mockResolvedValue({ ok: true });

    const { result } = renderHook(() => useDeleteTechSupportMutation(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.mutateAsync(1);
    });

    expect(mockFetch).toHaveBeenCalledWith('/api/support/1', { method: 'DELETE' });
  });
});

describe('useUploadAttachmentMutation', () => {
  const mockFetch = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = mockFetch;
  });

  it('should upload with FormData', async () => {
    mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve({}) });

    const { result } = renderHook(() => useUploadAttachmentMutation(), {
      wrapper: createWrapper(),
    });

    const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
    await act(async () => {
      await result.current.mutateAsync({ id: 1, file });
    });

    expect(mockFetch).toHaveBeenCalledWith('/api/support/1/attachment', expect.objectContaining({
      method: 'POST',
    }));
    const body = mockFetch.mock.calls[0][1].body;
    expect(body).toBeInstanceOf(FormData);
  });
});

describe('useDeleteAttachmentMutation', () => {
  const mockFetch = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = mockFetch;
  });

  it('should call DELETE attachment', async () => {
    mockFetch.mockResolvedValue({ ok: true });

    const { result } = renderHook(() => useDeleteAttachmentMutation(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.mutateAsync(1);
    });

    expect(mockFetch).toHaveBeenCalledWith('/api/support/1/attachment', { method: 'DELETE' });
  });
});
