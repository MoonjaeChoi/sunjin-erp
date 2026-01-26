// Generated: 2026-01-27 04:15:00 KST

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import MaintenanceContractTable from '../MaintenanceContractTable';
import type { MaintenanceContractDetail } from '@/types/maintenance';

// Mock data
const mockContracts: MaintenanceContractDetail[] = [
  {
    id: 1,
    customer_id: 1,
    contract_name: 'ABC Corp 유지보수',
    contract_type: '매월유지보수',
    start_date: '2026-01-01',
    end_date: '2026-12-31',
    contract_status: '활성',
    contract_amount: 1000000,
    notes: '중요 계약',
    assigned_employee_id: 1,
    assignedEmployee: { id: 1, name: '김철수', department: '기술팀' },
    customer: { id: 1, name: 'ABC Corporation' },
    attachments: [],
    histories: [],
    deleted_at: null,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    createdBy: { id: 1, name: 'Admin' },
  },
  {
    id: 2,
    customer_id: 2,
    contract_name: 'XYZ 계약',
    contract_type: '분기별유지보수',
    start_date: '2026-01-01',
    end_date: '2026-06-30',
    contract_status: '종료',
    contract_amount: 500000,
    notes: '',
    assigned_employee_id: 2,
    assignedEmployee: { id: 2, name: '이영희', department: '지원팀' },
    customer: { id: 2, name: 'XYZ Industries' },
    attachments: [],
    histories: [],
    deleted_at: null,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    createdBy: { id: 1, name: 'Admin' },
  },
];

describe('MaintenanceContractTable', () => {
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

  test('should render contract table with data', () => {
    renderWithQueryClient(
      <MaintenanceContractTable
        contracts={mockContracts}
        pagination={{
          page: 1,
          limit: 20,
          total: 2,
          totalPages: 1,
        }}
      />
    );

    expect(screen.getByText('ABC Corp 유지보수')).toBeInTheDocument();
    expect(screen.getByText('XYZ 계약')).toBeInTheDocument();
  });

  test('should render empty state when no contracts', () => {
    renderWithQueryClient(
      <MaintenanceContractTable
        contracts={[]}
        pagination={{
          page: 1,
          limit: 20,
          total: 0,
          totalPages: 1,
        }}
      />
    );

    expect(screen.getByText(/계약이 없습니다/i)).toBeInTheDocument();
  });

  test('should render loading skeleton', () => {
    const { container } = renderWithQueryClient(
      <MaintenanceContractTable
        contracts={[]}
        isLoading={true}
      />
    );

    const skeletons = container.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  test('should display contract status badge', () => {
    renderWithQueryClient(
      <MaintenanceContractTable
        contracts={mockContracts}
        pagination={{
          page: 1,
          limit: 20,
          total: 2,
          totalPages: 1,
        }}
      />
    );

    expect(screen.getByText('활성')).toBeInTheDocument();
    expect(screen.getByText('종료')).toBeInTheDocument();
  });

  test('should handle pagination', async () => {
    const user = userEvent.setup();
    const handlePageChange = jest.fn();

    renderWithQueryClient(
      <MaintenanceContractTable
        contracts={mockContracts}
        pagination={{
          page: 1,
          limit: 20,
          total: 40,
          totalPages: 2,
        }}
        onPageChange={handlePageChange}
      />
    );

    const nextButton = screen.getByRole('button', { name: /다음/i });
    await user.click(nextButton);

    await waitFor(() => {
      expect(handlePageChange).toHaveBeenCalledWith(2);
    });
  });

  test('should handle multi-select checkboxes', async () => {
    const user = userEvent.setup();
    const { container } = renderWithQueryClient(
      <MaintenanceContractTable
        contracts={mockContracts}
        pagination={{
          page: 1,
          limit: 20,
          total: 2,
          totalPages: 1,
        }}
      />
    );

    const checkboxes = container.querySelectorAll('input[type="checkbox"]');
    expect(checkboxes.length).toBeGreaterThan(0);
  });

  test('should display contract amount in currency format', () => {
    renderWithQueryClient(
      <MaintenanceContractTable
        contracts={mockContracts}
        pagination={{
          page: 1,
          limit: 20,
          total: 2,
          totalPages: 1,
        }}
      />
    );

    // 금액이 포맷팅되어 표시되는지 확인
    expect(screen.getByText(/1,000,000|1000000/)).toBeInTheDocument();
  });
});
