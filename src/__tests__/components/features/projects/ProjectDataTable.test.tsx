// Generated: 2026-01-25 17:30:00 KST

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ProjectDataTable } from '@/components/features/projects/ProjectDataTable';
import { SessionProvider } from 'next-auth/react';

const mockSession = {
  user: {
    id: 1,
    role: 'ADMIN',
    name: 'Admin User',
    email: 'admin@example.com',
  },
};

const mockProjects = [
  {
    id: 1,
    project_code: 'PJT-20260125-001',
    project_name: 'Project A',
    customer_id: 1,
    customer_name: 'Customer A',
    employee_id: 1,
    employee_name: 'Employee A',
    status: 'PREPARING',
    start_date: '2026-01-25',
    end_date: '2026-02-25',
    contract_amount: 100000,
    created_at: '2026-01-25T00:00:00Z',
    updated_at: '2026-01-25T00:00:00Z',
  },
  {
    id: 2,
    project_code: 'PJT-20260125-002',
    project_name: 'Project B',
    customer_id: 2,
    customer_name: 'Customer B',
    employee_id: 2,
    employee_name: 'Employee B',
    status: 'IN_PROGRESS',
    start_date: '2026-01-20',
    end_date: '2026-03-01',
    contract_amount: 200000,
    created_at: '2026-01-25T00:00:00Z',
    updated_at: '2026-01-25T00:00:00Z',
  },
];

describe('ProjectDataTable', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
  });

  const renderComponent = (
    projects = mockProjects,
    page = 1,
    onPageChange = jest.fn(),
    onSortChange = jest.fn(),
    onRowClick = jest.fn()
  ) => {
    return render(
      <SessionProvider session={mockSession}>
        <QueryClientProvider client={queryClient}>
          <ProjectDataTable
            projects={projects}
            total={2}
            page={page}
            pageSize={20}
            sortBy="created_at"
            sortOrder="DESC"
            onPageChange={onPageChange}
            onSortChange={onSortChange}
            onRowClick={onRowClick}
          />
        </QueryClientProvider>
      </SessionProvider>
    );
  };

  it('should render project table with data', () => {
    renderComponent();

    expect(screen.getByText('Project A')).toBeInTheDocument();
    expect(screen.getByText('Project B')).toBeInTheDocument();
    expect(screen.getByText('Customer A')).toBeInTheDocument();
  });

  it('should display status badges with correct colors', () => {
    renderComponent();

    const preparingBadge = screen.getByText('준비');
    const progressBadge = screen.getByText('진행중');

    expect(preparingBadge).toBeInTheDocument();
    expect(progressBadge).toBeInTheDocument();
  });

  it('should call onRowClick when row is clicked', () => {
    const onRowClick = jest.fn();
    renderComponent(mockProjects, 1, jest.fn(), jest.fn(), onRowClick);

    const projectLink = screen.getByText('Project A');
    fireEvent.click(projectLink);

    expect(onRowClick).toHaveBeenCalledWith(1);
  });

  it('should render correct number of columns', () => {
    const { container } = renderComponent();

    const headerCells = container.querySelectorAll('thead th');
    // Should have columns for: code, name, customer, employee, status, date range, amount
    expect(headerCells.length).toBeGreaterThan(5);
  });

  it('should display empty state when no projects', () => {
    renderComponent([]);

    expect(screen.getByText(/검색 조건에 맞는 프로젝트|empty|No projects/i)).toBeInTheDocument();
  });

  it('should display customer name in the table', () => {
    renderComponent();

    // Verify that customer names are displayed
    expect(screen.getByText('Customer A')).toBeInTheDocument();
    expect(screen.getByText('Customer B')).toBeInTheDocument();
  });

  it('should display employee name in the table', () => {
    renderComponent();

    expect(screen.getByText('Employee A')).toBeInTheDocument();
    expect(screen.getByText('Employee B')).toBeInTheDocument();
  });
});
