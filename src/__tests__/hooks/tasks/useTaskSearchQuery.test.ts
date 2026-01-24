// Generated: 2026-01-25 04:20:00 KST

import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useTaskSearchQuery } from '@/hooks/tasks/useTaskSearchQuery';
import { TaskSearchParams } from '@/types/task-search';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

describe('useTaskSearchQuery', () => {
  const mockFetch = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = mockFetch;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const validParams: TaskSearchParams = {
    date_from: '2026-01-01',
    date_to: '2026-01-31',
    page: 1,
    page_size: 20,
    sort_by: 'task_date',
    sort_order: 'DESC',
  };

  it('should fetch tasks with valid params', async () => {
    const mockData = { tasks: [{ id: 1, title: 'Test' }], total: 1, page: 1, page_size: 20 };
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockData),
    });

    const { result } = renderHook(() => useTaskSearchQuery(validParams), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockData);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/tasks?')
    );
  });

  it('should not fetch when date_from is empty', () => {
    const params: TaskSearchParams = { ...validParams, date_from: '' };

    const { result } = renderHook(() => useTaskSearchQuery(params), {
      wrapper: createWrapper(),
    });

    expect(result.current.fetchStatus).toBe('idle');
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('should not fetch when date_to is empty', () => {
    const params: TaskSearchParams = { ...validParams, date_to: '' };

    const { result } = renderHook(() => useTaskSearchQuery(params), {
      wrapper: createWrapper(),
    });

    expect(result.current.fetchStatus).toBe('idle');
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('should include optional filters in URL', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ tasks: [], total: 0, page: 1, page_size: 20 }),
    });

    const params: TaskSearchParams = {
      ...validParams,
      type: 'DOCUMENT',
      work_type: 'OFFICE',
      status: 'READY',
      keyword: '테스트',
    };

    const { result } = renderHook(() => useTaskSearchQuery(params), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    const calledUrl = mockFetch.mock.calls[0][0] as string;
    expect(calledUrl).toContain('type=DOCUMENT');
    expect(calledUrl).toContain('work_type=OFFICE');
    expect(calledUrl).toContain('status=READY');
    expect(calledUrl).toContain('keyword=');
  });

  it('should not include keyword shorter than 2 chars', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ tasks: [], total: 0, page: 1, page_size: 20 }),
    });

    const params: TaskSearchParams = { ...validParams, keyword: '가' };

    const { result } = renderHook(() => useTaskSearchQuery(params), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    const calledUrl = mockFetch.mock.calls[0][0] as string;
    expect(calledUrl).not.toContain('keyword=');
  });

  it('should throw error on non-ok response', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: 'Bad Request' }),
    });

    const { result } = renderHook(() => useTaskSearchQuery(validParams), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe('Bad Request');
  });

  it('should include sort params in URL', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ tasks: [], total: 0, page: 1, page_size: 20 }),
    });

    const params: TaskSearchParams = { ...validParams, sort_by: 'title', sort_order: 'ASC' };

    const { result } = renderHook(() => useTaskSearchQuery(params), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    const calledUrl = mockFetch.mock.calls[0][0] as string;
    expect(calledUrl).toContain('sort_by=title');
    expect(calledUrl).toContain('sort_order=ASC');
  });
});
