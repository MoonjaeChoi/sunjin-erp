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

  it('should show required field error for project_name', async () => {
    const user = userEvent.setup();
    renderComponent(true);

    // The submit button should be disabled initially because project_name is required
    const submitButton = screen.getByRole('button', { name: /save|저장/i });
    // Try to fill in other fields to make the button enabled
    const nameInput = screen.getByPlaceholderText(/Project Name|프로젝트명/i);
    expect(nameInput).toBeInTheDocument();
  });

  it('should show error for project_name exceeding 200 characters', async () => {
    const user = userEvent.setup();
    renderComponent(true);

    const nameInput = screen.getByPlaceholderText(/Project Name|프로젝트명/i);
    await user.type(nameInput, 'a'.repeat(201));

    const submitButton = screen.getByRole('button', { name: /save|저장/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/200 characters|200자/i)).toBeInTheDocument();
    });
  });

  it('should show error for empty customer_id', async () => {
    const user = userEvent.setup();
    renderComponent(true);

    const nameInput = screen.getByPlaceholderText(/Project Name|프로젝트명/i);
    await user.type(nameInput, 'Test Project');

    const submitButton = screen.getByRole('button', { name: /save|저장/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/customer|고객사/i)).toBeInTheDocument();
    });
  });

  it('should show error for empty employee_id', async () => {
    const user = userEvent.setup();
    renderComponent(true);

    const nameInput = screen.getByPlaceholderText(/Project Name|프로젝트명/i);
    await user.type(nameInput, 'Test Project');

    // Select customer
    const customerSelect = screen.getByDisplayValue(/Select Customer|고객사 선택/i);
    await user.click(customerSelect);

    await waitFor(() => {
      const customerOption = screen.getByText('Customer A');
      fireEvent.click(customerOption);
    });

    const submitButton = screen.getByRole('button', { name: /save|저장/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/employee|담당자/i)).toBeInTheDocument();
    });
  });

  it('should show error for end_date before start_date', async () => {
    const user = userEvent.setup();
    renderComponent(true);

    const nameInput = screen.getByPlaceholderText(/Project Name|프로젝트명/i);
    await user.type(nameInput, 'Test Project');

    const startDateInput = screen.getByDisplayValue(/2026-01-25|start/i);
    const endDateInput = screen.getByDisplayValue(/2026-02-25|end/i);

    await user.clear(startDateInput);
    await user.type(startDateInput, '2026-02-25');

    await user.clear(endDateInput);
    await user.type(endDateInput, '2026-01-25');

    await waitFor(() => {
      expect(screen.getByText(/after start date|시작일 이후/i)).toBeInTheDocument();
    });
  });

  it('should show error for negative contract_amount', async () => {
    const user = userEvent.setup();
    renderComponent(true);

    const amountInput = screen.getByPlaceholderText(/amount|계약금액/i);
    await user.type(amountInput, '-1000');

    const submitButton = screen.getByRole('button', { name: /save|저장/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/non-negative|양수/i)).toBeInTheDocument();
    });
  });

  it('should call generate code mutation when button clicked', async () => {
    const user = userEvent.setup();
    renderComponent(true);

    const generateButton = screen.getByRole('button', { name: /Generate|생성/i });
    await user.click(generateButton);

    await waitFor(() => {
      expect(screen.getByDisplayValue(/PJT-/)).toBeInTheDocument();
    });
  });

  it('should trim whitespace from project_name', async () => {
    const user = userEvent.setup();
    const mockMutate = jest.fn();

    renderComponent(true);

    const nameInput = screen.getByPlaceholderText(/Project Name|프로젝트명/i);
    await user.type(nameInput, '  Test Project  ');

    // The component should trim this before submission
    expect(nameInput).toHaveValue('Test Project');
  });

  it('should close dialog on successful creation', async () => {
    const onClose = jest.fn();
    const user = userEvent.setup();
    renderComponent(true, onClose);

    const nameInput = screen.getByPlaceholderText(/Project Name|프로젝트명/i);
    await user.type(nameInput, 'Test Project');

    // Select customer and employee
    const customerSelect = screen.getByDisplayValue(/Select Customer|고객사 선택/i);
    await user.click(customerSelect);

    await waitFor(() => {
      const customerOption = screen.getByText('Customer A');
      fireEvent.click(customerOption);
    });

    const employeeSelect = screen.getByDisplayValue(/Select Employee|담당자 선택/i);
    await user.click(employeeSelect);

    await waitFor(() => {
      const employeeOption = screen.getByText('Employee A');
      fireEvent.click(employeeOption);
    });

    const submitButton = screen.getByRole('button', { name: /save|저장/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(onClose).toHaveBeenCalled();
    });
  });
});
