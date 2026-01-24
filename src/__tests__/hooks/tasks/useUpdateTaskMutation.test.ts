// Generated: 2026-01-25 04:20:00 KST

import { renderHook, waitFor, act } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useUpdateTaskMutation } from '@/hooks/tasks/useUpdateTaskMutation';
import { UpdateTaskDto } from '@/types/task-search';

function createTestSetup() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  const invalidateQueriesSpy = jest.spyOn(queryClient, 'invalidateQueries');

  function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children);
  }

  return { queryClient, invalidateQueriesSpy, Wrapper };
}

describe('useUpdateTaskMutation', () => {
  const mockFetch = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = mockFetch;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const updateData: UpdateTaskDto = {
    title: 'Updated Task',
    description: null,
    task_date: '2026-01-15',
    task_type: 'DOCUMENT',
    work_type: 'OFFICE',
    status: 'IN_PROGRESS',
    start_time: 540,
    end_time: 600,
  };

  it('should call PUT /api/tasks/:id', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: 5, ...updateData }),
    });

    const { Wrapper } = createTestSetup();
    const { result } = renderHook(() => useUpdateTaskMutation(), { wrapper: Wrapper });

    await act(async () => {
      await result.current.mutateAsync({ id: 5, data: updateData });
    });

    expect(mockFetch).toHaveBeenCalledWith('/api/tasks/5', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData),
    });
  });

  it('should invalidate caches on success', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ id: 5, ...updateData }),
    });

    const { Wrapper, invalidateQueriesSpy } = createTestSetup();
    const { result } = renderHook(() => useUpdateTaskMutation(), { wrapper: Wrapper });

    await act(async () => {
      await result.current.mutateAsync({ id: 5, data: updateData });
    });

    await waitFor(() => {
      expect(invalidateQueriesSpy).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ['tasks', 'search'] })
      );
      expect(invalidateQueriesSpy).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ['tasks', 'detail', 5] })
      );
      expect(invalidateQueriesSpy).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ['tasks'] })
      );
      expect(invalidateQueriesSpy).toHaveBeenCalledWith(
        expect.objectContaining({ queryKey: ['dashboard'] })
      );
    });
  });

  it('should throw error on non-ok response', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: 'Forbidden' }),
    });

    const { Wrapper } = createTestSetup();
    const { result } = renderHook(() => useUpdateTaskMutation(), { wrapper: Wrapper });

    await expect(
      act(async () => {
        await result.current.mutateAsync({ id: 5, data: updateData });
      })
    ).rejects.toThrow('Forbidden');
  });

  it('should handle json parse failure gracefully', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      json: () => Promise.reject(new Error('Parse error')),
    });

    const { Wrapper } = createTestSetup();
    const { result } = renderHook(() => useUpdateTaskMutation(), { wrapper: Wrapper });

    await expect(
      act(async () => {
        await result.current.mutateAsync({ id: 5, data: updateData });
      })
    ).rejects.toThrow('Failed to update task');
  });
});
