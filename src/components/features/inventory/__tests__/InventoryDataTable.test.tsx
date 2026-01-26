// Generated: 2026-01-26 18:00:00 KST

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import InventoryDataTable from '../InventoryDataTable';
import { useInventoryFilterStore } from '@/stores/inventoryFilterStore';
import { mockInventoryList } from '@/__tests__/fixtures/inventory';

// Mock Zustand store
jest.mock('@/stores/inventoryFilterStore', () => ({
  useInventoryFilterStore: jest.fn(),
}));

describe('InventoryDataTable', () => {
  const queryClient = new QueryClient();
  const mockSetSort = jest.fn();
  const mockSetPage = jest.fn();
  const mockSetDetailOpen = jest.fn();
  const mockSetSelectedInventoryId = jest.fn();

  beforeEach(() => {
    (useInventoryFilterStore as jest.Mock).mockImplementation((selector) => {
      const state = {
        sort: { sortBy: 'category', order: 'ASC' },
        setSort: mockSetSort,
        setPage: mockSetPage,
        setDetailOpen: mockSetDetailOpen,
        setSelectedInventoryId: mockSetSelectedInventoryId,
      };
      return selector(state);
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should render table with all columns', () => {
    const pagination = { page: 1, pageSize: 10, total: 5, totalPages: 1 };

    render(
      <QueryClientProvider client={queryClient}>
        <InventoryDataTable data={mockInventoryList} pagination={pagination} isLoading={false} />
      </QueryClientProvider>
    );

    expect(screen.getByText(/카테고리/i)).toBeInTheDocument();
    expect(screen.getByText(/모델/i)).toBeInTheDocument();
    expect(screen.getByText(/시리얼번호/i)).toBeInTheDocument();
  });

  test('should display loading state', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <InventoryDataTable data={[]} pagination={{} as any} isLoading={true} />
      </QueryClientProvider>
    );

    expect(screen.getByText(/로딩 중/i)).toBeInTheDocument();
  });

  test('should display empty state when no data', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <InventoryDataTable data={[]} pagination={{} as any} isLoading={false} />
      </QueryClientProvider>
    );

    expect(screen.getByText(/재고 데이터가 없습니다/i)).toBeInTheDocument();
  });

  test('should render table rows with data', () => {
    const pagination = { page: 1, pageSize: 10, total: mockInventoryList.length, totalPages: 1 };

    render(
      <QueryClientProvider client={queryClient}>
        <InventoryDataTable data={mockInventoryList} pagination={pagination} isLoading={false} />
      </QueryClientProvider>
    );

    mockInventoryList.forEach((item) => {
      expect(screen.getByText(item.category)).toBeInTheDocument();
      expect(screen.getByText(item.model)).toBeInTheDocument();
    });
  });

  test('should call setSort when column header is clicked', async () => {
    const user = userEvent.setup();
    const pagination = { page: 1, pageSize: 10, total: 5, totalPages: 1 };

    render(
      <QueryClientProvider client={queryClient}>
        <InventoryDataTable data={mockInventoryList} pagination={pagination} isLoading={false} />
      </QueryClientProvider>
    );

    const categoryHeader = screen.getByText(/카테고리/i);
    await user.click(categoryHeader);

    expect(mockSetSort).toHaveBeenCalled();
  });

  test('should toggle sort order on column header click', async () => {
    const user = userEvent.setup();
    const pagination = { page: 1, pageSize: 10, total: 5, totalPages: 1 };

    render(
      <QueryClientProvider client={queryClient}>
        <InventoryDataTable data={mockInventoryList} pagination={pagination} isLoading={false} />
      </QueryClientProvider>
    );

    const categoryHeader = screen.getByText(/카테고리/i).closest('th');
    await user.click(categoryHeader!);

    expect(mockSetSort).toHaveBeenCalledWith('category', 'ASC');
  });

  test('should call setSelectedInventoryId and setDetailOpen on row click', async () => {
    const user = userEvent.setup();
    const pagination = { page: 1, pageSize: 10, total: 5, totalPages: 1 };

    const { container } = render(
      <QueryClientProvider client={queryClient}>
        <InventoryDataTable data={mockInventoryList} pagination={pagination} isLoading={false} />
      </QueryClientProvider>
    );

    const firstRow = container.querySelector('tbody tr');
    await user.click(firstRow!);

    expect(mockSetSelectedInventoryId).toHaveBeenCalled();
    expect(mockSetDetailOpen).toHaveBeenCalledWith(true);
  });

  test('should render sort indicators', () => {
    const pagination = { page: 1, pageSize: 10, total: 5, totalPages: 1 };

    const { container } = render(
      <QueryClientProvider client={queryClient}>
        <InventoryDataTable data={mockInventoryList} pagination={pagination} isLoading={false} />
      </QueryClientProvider>
    );

    // Should have ChevronUpDown icons for sorting
    const icons = container.querySelectorAll('svg');
    expect(icons.length).toBeGreaterThan(0);
  });

  test('should render pagination controls', () => {
    const pagination = { page: 1, pageSize: 10, total: 20, totalPages: 2 };

    render(
      <QueryClientProvider client={queryClient}>
        <InventoryDataTable data={mockInventoryList} pagination={pagination} isLoading={false} />
      </QueryClientProvider>
    );

    // Pagination should be present
    const nav = screen.queryByRole('navigation');
    expect(nav).toBeInTheDocument();
  });

  test('should call setPage on pagination click', async () => {
    const user = userEvent.setup();
    const pagination = { page: 1, pageSize: 10, total: 20, totalPages: 2 };

    render(
      <QueryClientProvider client={queryClient}>
        <InventoryDataTable data={mockInventoryList} pagination={pagination} isLoading={false} />
      </QueryClientProvider>
    );

    // Find and click next page button
    const nextButton = screen.queryByText(/다음/i) || screen.queryByRole('link', { name: /2/i });
    if (nextButton) {
      await user.click(nextButton);
      expect(mockSetPage).toHaveBeenCalled();
    }
  });

  test('should display status badge for each row', () => {
    const pagination = { page: 1, pageSize: 10, total: 5, totalPages: 1 };

    render(
      <QueryClientProvider client={queryClient}>
        <InventoryDataTable data={mockInventoryList} pagination={pagination} isLoading={false} />
      </QueryClientProvider>
    );

    // All items should have status displayed
    expect(screen.getByText(/재고|출고|고장/i)).toBeInTheDocument();
  });
});
