// Generated: 2026-01-28 03:05:00 KST

import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';

// Mock fetch
global.fetch = jest.fn();

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });
  const Wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
  Wrapper.displayName = 'TestQueryClientWrapper';
  return Wrapper;
};

import {
  useEmployees,
  useEmployee,
  useCreateEmployee,
  useDepartments,
  usePositions,
  useDeactivateEmployee,
  employeeQueryKeys,
  departmentQueryKeys,
  positionQueryKeys,
} from '@/hooks/useEmployees';

describe('useEmployees', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch employee list with query params', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        data: [
          { id: 1, name: '홍길동', email: 'hong@example.com' },
        ],
        pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
      }),
    });

    const { result } = renderHook(() => useEmployees({ page: 1, limit: 20 }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.data).toHaveLength(1);
    expect(result.current.data?.data[0].name).toBe('홍길동');
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/employees'),
      expect.any(Object)
    );
  });

  it('should apply search filter to query', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        data: [],
        pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
      }),
    });

    const { result } = renderHook(() => useEmployees({ search: 'hong' }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isFetched).toBe(true));

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('search=hong'),
      expect.any(Object)
    );
  });
});

describe('useEmployee', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch single employee', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        data: {
          id: 1,
          name: '홍길동',
          email: 'hong@example.com',
          departmentName: '개발팀',
        },
      }),
    });

    const { result } = renderHook(() => useEmployee(1), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.name).toBe('홍길동');
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/employees/1'),
      expect.any(Object)
    );
  });
});

describe('useCreateEmployee', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create employee and return data', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        data: { id: 100, name: '새직원', email: 'new@example.com' },
      }),
    });

    const { result } = renderHook(() => useCreateEmployee(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      name: '새직원',
      email: 'new@example.com',
      departmentId: 1,
      positionId: 1,
      hiredAt: '2023-01-01',
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/employees',
      expect.objectContaining({ method: 'POST' })
    );
  });
});

describe('useDepartments', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch departments', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        data: [
          { id: 1, name: '본부', level: 1, children: [] },
        ],
      }),
    });

    const { result } = renderHook(() => useDepartments(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toHaveLength(1);
    expect(result.current.data?.[0].name).toBe('본부');
  });
});

describe('usePositions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch positions', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        data: [
          { id: 1, name: '사원', level: 1 },
          { id: 2, name: '대리', level: 2 },
        ],
      }),
    });

    const { result } = renderHook(() => usePositions(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toHaveLength(2);
    expect(result.current.data?.[0].name).toBe('사원');
  });
});

describe('useDeactivateEmployee', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should deactivate employee', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        message: '계정이 비활성화되었습니다.',
      }),
    });

    const { result } = renderHook(() => useDeactivateEmployee(1), {
      wrapper: createWrapper(),
    });

    result.current.mutate();

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/employees/1/deactivate',
      expect.objectContaining({ method: 'POST' })
    );
  });
});

describe('Query Keys', () => {
  it('should generate correct employee query keys', () => {
    expect(employeeQueryKeys.all).toEqual(['employees']);
    expect(employeeQueryKeys.lists()).toEqual(['employees', 'list']);
    expect(employeeQueryKeys.list({ page: 1 })).toEqual(['employees', 'list', { page: 1 }]);
    expect(employeeQueryKeys.detail(1)).toEqual(['employees', 'detail', 1]);
  });

  it('should generate correct department query keys', () => {
    expect(departmentQueryKeys.all).toEqual(['departments']);
    expect(departmentQueryKeys.list()).toEqual(['departments', 'list']);
    expect(departmentQueryKeys.detail(1)).toEqual(['departments', 'detail', 1]);
  });

  it('should generate correct position query keys', () => {
    expect(positionQueryKeys.all).toEqual(['positions']);
    expect(positionQueryKeys.list()).toEqual(['positions', 'list']);
    expect(positionQueryKeys.detail(1)).toEqual(['positions', 'detail', 1]);
  });
});
