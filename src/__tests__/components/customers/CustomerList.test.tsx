// Generated: 2026-01-28 02:15:00 KST

jest.mock('@/hooks/useCustomers', () => ({
  useCustomers: jest.fn(),
}));

jest.mock('next/link', () => {
  return function MockLink({ children, href }: any) {
    return <a href={href}>{children}</a>;
  };
});

jest.mock('lucide-react', () => ({
  Plus: () => <span>Plus Icon</span>,
  ArrowUpDown: () => <span>Sort Icon</span>,
}));

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { CustomerList } from '@/components/features/customers/CustomerList';
import { useCustomers } from '@/hooks/useCustomers';

const mockUseCustomers = useCustomers as jest.Mock;

describe('CustomerList Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render loading state', () => {
    mockUseCustomers.mockReturnValue({
      data: null,
      isLoading: true,
      error: null,
    });

    render(<CustomerList />);
    expect(screen.getByText(/로딩 중/)).toBeInTheDocument();
  });

  it('should render customer list', () => {
    mockUseCustomers.mockReturnValue({
      data: {
        data: [
          {
            id: 1,
            name: 'Customer A',
            classification: 'END_USER',
            managerName: 'Manager A',
            phone: '010-1234-5678',
          },
          {
            id: 2,
            name: 'Customer B',
            classification: 'RESELLER',
            managerName: 'Manager B',
            phone: '010-9876-5432',
          },
        ],
        pagination: { page: 1, limit: 20, total: 2, totalPages: 1 },
      },
      isLoading: false,
      error: null,
    });

    render(<CustomerList />);

    expect(screen.getByText('Customer A')).toBeInTheDocument();
    expect(screen.getByText('Customer B')).toBeInTheDocument();
  });

  it('should show empty state when no customers', () => {
    mockUseCustomers.mockReturnValue({
      data: {
        data: [],
        pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
      },
      isLoading: false,
      error: null,
    });

    render(<CustomerList />);
    expect(screen.getByText(/고객이 없습니다/)).toBeInTheDocument();
  });

  it('should handle search input', () => {
    mockUseCustomers.mockReturnValue({
      data: {
        data: [
          {
            id: 1,
            name: 'Test Customer',
            classification: 'END_USER',
            managerName: 'Manager',
            phone: '010-1234-5678',
          },
        ],
        pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
      },
      isLoading: false,
      error: null,
    });

    const { rerender } = render(<CustomerList />);
    const searchInput = screen.getByPlaceholderText(/고객명 검색/);

    fireEvent.change(searchInput, { target: { value: 'Test' } });

    rerender(<CustomerList />);
    expect(mockUseCustomers).toHaveBeenCalled();
  });

  it('should display classification badges', () => {
    mockUseCustomers.mockReturnValue({
      data: {
        data: [
          {
            id: 1,
            name: 'Customer A',
            classification: 'END_USER',
            managerName: null,
            phone: null,
          },
        ],
        pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
      },
      isLoading: false,
      error: null,
    });

    render(<CustomerList />);
    expect(screen.getByText('Customer A')).toBeInTheDocument();
  });

  it('should show error state', () => {
    mockUseCustomers.mockReturnValue({
      data: null,
      isLoading: false,
      error: { message: 'Failed to fetch customers' },
    });

    render(<CustomerList />);
    expect(screen.getByText(/오류/)).toBeInTheDocument();
  });
});
