// Generated: 2026-01-28 03:35:00 KST

import React from 'react';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock hooks
const mockUseDepartments = jest.fn();
const mockUsePositions = jest.fn();
const mockUseCreateEmployee = jest.fn();
const mockUseUpdateEmployee = jest.fn();
const mockUseEmployeeListQuery = jest.fn();

jest.mock('@/hooks/useEmployees', () => ({
  useDepartments: () => mockUseDepartments(),
  usePositions: () => mockUsePositions(),
  useCreateEmployee: () => mockUseCreateEmployee(),
  useUpdateEmployee: () => mockUseUpdateEmployee(),
}));

jest.mock('@/hooks/employees', () => ({
  useEmployeeListQuery: () => mockUseEmployeeListQuery(),
}));

// Mock next/navigation
const mockPush = jest.fn();
const mockBack = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, back: mockBack }),
}));

// Mock sonner
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

import { EmployeeForm } from '@/components/features/employees/EmployeeForm';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  Wrapper.displayName = 'TestQueryClientWrapper';
  return Wrapper;
};

describe('EmployeeForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockUseDepartments.mockReturnValue({
      data: [
        { id: 1, name: '본부', level: 1, children: [
          { id: 2, name: '개발팀', level: 2, children: [] },
        ]},
      ],
      isLoading: false,
    });

    mockUsePositions.mockReturnValue({
      data: [
        { id: 1, name: '사원', level: 1 },
        { id: 2, name: '대리', level: 2 },
      ],
      isLoading: false,
    });

    mockUseEmployeeListQuery.mockReturnValue({
      data: { employees: [] },
      isLoading: false,
    });

    mockUseCreateEmployee.mockReturnValue({
      mutateAsync: jest.fn().mockResolvedValue({ data: { id: 1 } }),
      isPending: false,
    });

    mockUseUpdateEmployee.mockReturnValue({
      mutateAsync: jest.fn().mockResolvedValue({ data: { id: 1 } }),
      isPending: false,
    });
  });

  it('should render create form when no employee provided', () => {
    render(<EmployeeForm />, { wrapper: createWrapper() });

    // Check basic form elements exist
    expect(screen.getByLabelText(/이름/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/이메일/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/입사일/i)).toBeInTheDocument();
  });

  it('should have empty inputs for new employee', () => {
    render(<EmployeeForm />, { wrapper: createWrapper() });

    expect(screen.getByLabelText(/이름/i)).toHaveValue('');
    expect(screen.getByLabelText(/이메일/i)).toHaveValue('');
  });

  it('should render edit form with employee data', () => {
    const employee = {
      id: 1,
      name: '홍길동',
      email: 'hong@example.com',
      phone: '010-1234-5678',
      departmentId: 2,
      departmentName: '개발팀',
      positionId: 2,
      positionName: '대리',
      hiredAt: '2023-01-01T00:00:00.000Z',
    };

    render(<EmployeeForm employee={employee as any} />, { wrapper: createWrapper() });

    expect(screen.getByLabelText(/이름/i)).toHaveValue('홍길동');
    expect(screen.getByLabelText(/이메일/i)).toHaveValue('hong@example.com');
    expect(screen.getByLabelText(/전화번호/i)).toHaveValue('010-1234-5678');
  });

  it('should show loading state during submission', () => {
    mockUseCreateEmployee.mockReturnValue({
      mutateAsync: jest.fn(),
      isPending: true,
    });

    render(<EmployeeForm />, { wrapper: createWrapper() });

    // Submit button should be disabled during submission
    const submitButtons = screen.getAllByRole('button');
    const submitButton = submitButtons.find(btn => btn.textContent?.includes('등록') || btn.textContent?.includes('저장'));
    expect(submitButton).toBeDisabled();
  });
});
