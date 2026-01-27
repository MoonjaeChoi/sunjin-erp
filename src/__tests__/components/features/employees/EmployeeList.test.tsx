// Generated: 2026-01-28 03:30:00 KST

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock hooks
const mockUseEmployees = jest.fn();
const mockUseDepartments = jest.fn();
const mockUsePositions = jest.fn();
const mockUseDeleteEmployee = jest.fn();

jest.mock('@/hooks/useEmployees', () => ({
  useEmployees: () => mockUseEmployees(),
  useDepartments: () => mockUseDepartments(),
  usePositions: () => mockUsePositions(),
  useDeleteEmployee: () => mockUseDeleteEmployee(),
}));

// Mock next/navigation
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

// Mock sonner
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

import { EmployeeList } from '@/components/features/employees/EmployeeList';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('EmployeeList', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockUseDepartments.mockReturnValue({
      data: [{ id: 1, name: '개발팀', children: [] }],
      isLoading: false,
    });

    mockUsePositions.mockReturnValue({
      data: [{ id: 1, name: '대리', level: 2 }],
      isLoading: false,
    });

    mockUseDeleteEmployee.mockReturnValue({
      mutateAsync: jest.fn(),
      isPending: false,
    });
  });

  it('should show loading state when data is loading', () => {
    mockUseEmployees.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    });

    render(<EmployeeList userRole="ADMIN" />, { wrapper: createWrapper() });

    // When loading, the table should not show employee data
    expect(screen.queryByText('hong@example.com')).not.toBeInTheDocument();
  });

  it('should render employee data when loaded', async () => {
    mockUseEmployees.mockReturnValue({
      data: {
        data: [
          {
            id: 1,
            name: '홍길동',
            email: 'hong@example.com',
            departmentName: '개발팀',
            positionName: '대리',
            hiredAt: '2023-01-01',
            isActive: true,
          },
        ],
        pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
      },
      isLoading: false,
      error: null,
    });

    render(<EmployeeList userRole="ADMIN" />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('홍길동')).toBeInTheDocument();
      expect(screen.getByText('hong@example.com')).toBeInTheDocument();
    });
  });

  it('should show error message when fetch fails', () => {
    mockUseEmployees.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Failed to fetch'),
    });

    render(<EmployeeList userRole="ADMIN" />, { wrapper: createWrapper() });

    expect(screen.getByText(/오류/i)).toBeInTheDocument();
  });

  it('should show empty state when no employees', () => {
    mockUseEmployees.mockReturnValue({
      data: {
        data: [],
        pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
      },
      isLoading: false,
      error: null,
    });

    render(<EmployeeList userRole="ADMIN" />, { wrapper: createWrapper() });

    expect(screen.getByText(/직원이 없습니다/i)).toBeInTheDocument();
  });

  it('should have search input', () => {
    mockUseEmployees.mockReturnValue({
      data: {
        data: [],
        pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
      },
      isLoading: false,
      error: null,
    });

    render(<EmployeeList userRole="ADMIN" />, { wrapper: createWrapper() });

    const searchInput = screen.getByPlaceholderText(/검색/i);
    expect(searchInput).toBeInTheDocument();
  });
});
