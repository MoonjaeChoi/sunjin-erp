// Generated: 2026-01-25 17:30:00 KST

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SessionProvider } from 'next-auth/react';
import { ProjectCreateDialog } from '@/components/features/projects/ProjectCreateDialog';

const mockSession = {
  user: {
    id: 1,
    role: 'ADMIN',
    name: 'Admin User',
    email: 'admin@example.com',
  },
};

const mockCustomers = [
  { id: 1, name: 'Customer A' },
  { id: 2, name: 'Customer B' },
];

const mockEmployees = [
  { id: 1, name: 'Employee A', department_name: 'IT' },
  { id: 2, name: 'Employee B', department_name: 'Sales' },
];

jest.mock('@/hooks/projects', () => ({
  useCreateProjectMutation: () => ({
    mutateAsync: jest.fn().mockResolvedValue({ id: 1 }),
    isPending: false,
  }),
  useGenerateProjectCodeMutation: () => ({
    mutateAsync: jest.fn().mockResolvedValue({ code: 'PJT-20260125-001' }),
    isPending: false,
  }),
}));

jest.mock('@/hooks/customers', () => ({
  useCustomerListQuery: () => ({
    data: { customers: mockCustomers },
    isLoading: false,
    error: null,
  }),
}));

jest.mock('@/hooks/employees', () => ({
  useEmployeeListQuery: () => ({
    data: { employees: mockEmployees },
    isLoading: false,
    error: null,
  }),
}));

describe('ProjectCreateDialog', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
  });

  const renderComponent = (open = true, onClose = jest.fn()) => {
    return render(
      <SessionProvider session={mockSession}>
        <QueryClientProvider client={queryClient}>
          <ProjectCreateDialog open={open} onClose={onClose} />
        </QueryClientProvider>
      </SessionProvider>
    );
  };

  it('should not render when open is false', () => {
    renderComponent(false);

    expect(screen.queryByText(/Create Project|신규 프로젝트/)).not.toBeInTheDocument();
  });

  it('should render dialog when open is true', () => {
    renderComponent(true);

    expect(screen.getByText(/Create Project|신규 프로젝트/i)).toBeInTheDocument();
  });
});
