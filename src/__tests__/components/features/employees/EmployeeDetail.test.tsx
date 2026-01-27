// Generated: 2026-01-28 03:40:00 KST

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock hooks
const mockUseEmployee = jest.fn();
const mockUseEmployeeHistory = jest.fn();
const mockUseCreateAccount = jest.fn();
const mockUseDeactivateEmployee = jest.fn();
const mockUseReactivateEmployee = jest.fn();
const mockUseUpdateAccountRole = jest.fn();

jest.mock('@/hooks/useEmployees', () => ({
  useEmployee: () => mockUseEmployee(),
  useEmployeeHistory: () => mockUseEmployeeHistory(),
  useCreateAccount: () => mockUseCreateAccount(),
  useDeactivateEmployee: () => mockUseDeactivateEmployee(),
  useReactivateEmployee: () => mockUseReactivateEmployee(),
  useUpdateAccountRole: () => mockUseUpdateAccountRole(),
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

import { EmployeeDetail } from '@/components/features/employees/EmployeeDetail';

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

const mockEmployee = {
  id: 1,
  name: '홍길동',
  email: 'hong@example.com',
  phone: '010-1234-5678',
  jobTitle: '시니어 개발자',
  department: {
    id: 1,
    name: '개발팀',
    code: 'DEV',
  },
  position: {
    id: 2,
    name: '대리',
    code: 'LV3',
    level: 3,
  },
  manager: null,
  hiredAt: '2023-01-01T00:00:00.000Z',
  birthday: '1990-05-15T00:00:00.000Z',
  createdAt: '2023-01-01T00:00:00.000Z',
  updatedAt: '2023-01-01T00:00:00.000Z',
  account: {
    id: 100,
    username: 'hong',
    role: 'USER',
    isActive: true,
  },
};

describe('EmployeeDetail', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockUseEmployee.mockReturnValue({
      data: mockEmployee,
      isLoading: false,
      error: null,
    });

    mockUseEmployeeHistory.mockReturnValue({
      data: {
        data: [],
        pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
      },
      isLoading: false,
    });

    mockUseCreateAccount.mockReturnValue({
      mutateAsync: jest.fn(),
      isPending: false,
    });

    mockUseDeactivateEmployee.mockReturnValue({
      mutateAsync: jest.fn(),
      isPending: false,
    });

    mockUseReactivateEmployee.mockReturnValue({
      mutateAsync: jest.fn(),
      isPending: false,
    });

    mockUseUpdateAccountRole.mockReturnValue({
      mutateAsync: jest.fn(),
      isPending: false,
    });
  });

  it('should render employee basic info', async () => {
    render(<EmployeeDetail employeeId={1} userRole="ADMIN" />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('홍길동')).toBeInTheDocument();
      expect(screen.getByText('hong@example.com')).toBeInTheDocument();
    });
  });

  it('should show loading state when loading', () => {
    mockUseEmployee.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    });

    render(<EmployeeDetail employeeId={1} userRole="ADMIN" />, { wrapper: createWrapper() });

    // Should not show employee name while loading
    expect(screen.queryByText('홍길동')).not.toBeInTheDocument();
  });

  it('should show error state when fetch fails', () => {
    mockUseEmployee.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Failed to fetch'),
    });

    render(<EmployeeDetail employeeId={1} userRole="ADMIN" />, { wrapper: createWrapper() });

    expect(screen.getByText(/오류/i)).toBeInTheDocument();
  });

  it('should show not found state when employee not found', () => {
    mockUseEmployee.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: null,
    });

    render(<EmployeeDetail employeeId={999} userRole="ADMIN" />, { wrapper: createWrapper() });

    expect(screen.getByText(/찾을 수 없습니다/i)).toBeInTheDocument();
  });

  it('should display department and position info', async () => {
    render(<EmployeeDetail employeeId={1} userRole="ADMIN" />, { wrapper: createWrapper() });

    await waitFor(() => {
      // Department and position are displayed (can appear in multiple places)
      expect(screen.getAllByText(/개발팀/).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/대리/).length).toBeGreaterThan(0);
    });
  });
});
