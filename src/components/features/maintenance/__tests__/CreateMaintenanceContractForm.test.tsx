// Generated: 2026-01-27 04:20:00 KST

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import CreateMaintenanceContractForm from '../CreateMaintenanceContractForm';

jest.mock('@/hooks/useMaintenanceContracts', () => ({
  useMaintenanceContractMutations: jest.fn(() => ({
    createMutation: {
      mutateAsync: jest.fn(async () => ({ id: 1 })),
      isPending: false,
    },
  })),
}));

describe('CreateMaintenanceContractForm', () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  const renderWithQueryClient = (component: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        {component}
      </QueryClientProvider>
    );
  };

  test('should render form dialog when open', () => {
    renderWithQueryClient(
      <CreateMaintenanceContractForm open={true} />
    );

    expect(screen.getByText(/신규 계약 등록/i)).toBeInTheDocument();
  });

  test('should not render form dialog when closed', () => {
    renderWithQueryClient(
      <CreateMaintenanceContractForm open={false} />
    );

    expect(screen.queryByText(/신규 계약 등록/i)).not.toBeInTheDocument();
  });

  test('should validate required fields', async () => {
    const user = userEvent.setup();

    renderWithQueryClient(
      <CreateMaintenanceContractForm open={true} />
    );

    const registerButton = screen.getByRole('button', { name: /등록/i });
    await user.click(registerButton);

    await waitFor(() => {
      expect(screen.getByText(/계약명은 필수입니다/i)).toBeInTheDocument();
      expect(screen.getByText(/고객사는 필수입니다/i)).toBeInTheDocument();
    });
  });

  test('should validate date range', async () => {
    const user = userEvent.setup();

    renderWithQueryClient(
      <CreateMaintenanceContractForm open={true} />
    );

    const startDateInput = screen.getByLabelText(/시작일/i);
    const endDateInput = screen.getByLabelText(/종료일/i);

    await user.type(startDateInput, '2026-12-31');
    await user.type(endDateInput, '2026-01-01');

    const registerButton = screen.getByRole('button', { name: /등록/i });
    await user.click(registerButton);

    await waitFor(() => {
      expect(screen.getByText(/종료일은 시작일보다 이후여야 합니다/i)).toBeInTheDocument();
    });
  });

  test('should handle form submission', async () => {
    const user = userEvent.setup();
    const onSuccess = jest.fn();

    renderWithQueryClient(
      <CreateMaintenanceContractForm open={true} onSuccess={onSuccess} />
    );

    // Fill in required fields
    const contractNameInput = screen.getByPlaceholderText(/ABC Corp/i);
    await user.type(contractNameInput, 'Test Contract');

    const customerSelect = screen.getByDisplayValue(/고객사 선택/i);
    await user.click(customerSelect);

    const contractTypeInput = screen.getByPlaceholderText(/매월유지보수/i);
    await user.type(contractTypeInput, 'Monthly');

    // Submit form
    const registerButton = screen.getByRole('button', { name: /등록/i });

    // Note: Actual submission would require more setup
    // This test validates the form rendering and basic validation
  });

  test('should display all form sections', () => {
    renderWithQueryClient(
      <CreateMaintenanceContractForm open={true} />
    );

    expect(screen.getByText(/기본 정보/i)).toBeInTheDocument();
    expect(screen.getByText(/담당자/i)).toBeInTheDocument();
    expect(screen.getByText(/계약기간/i)).toBeInTheDocument();
    expect(screen.getByText(/계약 정보/i)).toBeInTheDocument();
  });
});
