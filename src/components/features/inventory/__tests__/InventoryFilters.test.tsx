// Generated: 2026-01-26 17:45:00 KST

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import InventoryFilters from '../InventoryFilters';
import { useInventoryFilterStore } from '@/stores/inventoryFilterStore';

// Mock Zustand store
jest.mock('@/stores/inventoryFilterStore', () => ({
  useInventoryFilterStore: jest.fn(),
}));

describe('InventoryFilters', () => {
  const queryClient = new QueryClient();
  const mockUpdateFilter = jest.fn();
  const mockClearFilters = jest.fn();

  beforeEach(() => {
    (useInventoryFilterStore as jest.Mock).mockImplementation((selector) => {
      const state = {
        filters: {
          categories: [],
          statuses: [],
          location: '',
          search: '',
        },
        updateFilter: mockUpdateFilter,
        clearFilters: mockClearFilters,
      };
      return selector(state);
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should render all filter inputs', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <InventoryFilters />
      </QueryClientProvider>
    );

    // Check for category buttons
    expect(screen.getByText(/모니터/i)).toBeInTheDocument();
    expect(screen.getByText(/노트북/i)).toBeInTheDocument();
    expect(screen.getByText(/라우터/i)).toBeInTheDocument();

    // Check for status buttons
    expect(screen.getByText(/재고/i)).toBeInTheDocument();
    expect(screen.getByText(/출고/i)).toBeInTheDocument();

    // Check for input fields
    expect(screen.getByPlaceholderText(/모델명/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/위치/i)).toBeInTheDocument();
  });

  test('should call updateFilter when category is selected', async () => {
    const user = userEvent.setup();

    render(
      <QueryClientProvider client={queryClient}>
        <InventoryFilters />
      </QueryClientProvider>
    );

    const monitorButtons = screen.getAllByText(/모니터/);
    const monitorButton = monitorButtons.find(btn => btn.closest('button'));

    if (monitorButton) {
      await user.click(monitorButton);
      expect(mockUpdateFilter).toHaveBeenCalled();
    }
  });

  test('should call updateFilter when search field changes', async () => {
    const user = userEvent.setup();

    render(
      <QueryClientProvider client={queryClient}>
        <InventoryFilters />
      </QueryClientProvider>
    );

    const searchInput = screen.getByPlaceholderText(/모델명/i) as HTMLInputElement;
    await user.type(searchInput, 'SN123');

    await waitFor(() => {
      expect(mockUpdateFilter).toHaveBeenCalled();
    });
  });

  test('should reset all filters when reset button is clicked', async () => {
    const user = userEvent.setup();

    render(
      <QueryClientProvider client={queryClient}>
        <InventoryFilters />
      </QueryClientProvider>
    );

    const resetButton = screen.getByText(/필터 초기화/i);
    await user.click(resetButton);

    expect(mockClearFilters).toHaveBeenCalled();
  });

  test('should handle multiple category selection', async () => {
    const user = userEvent.setup();

    render(
      <QueryClientProvider client={queryClient}>
        <InventoryFilters />
      </QueryClientProvider>
    );

    const categoryButtons = screen.getAllByText(/모니터|노트북/);

    for (const button of categoryButtons.slice(0, 2)) {
      await user.click(button);
    }

    expect(mockUpdateFilter).toHaveBeenCalledTimes(2);
  });

  test('should have accessible labels', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <InventoryFilters />
      </QueryClientProvider>
    );

    // Check for accessible label elements
    const formElements = screen.getAllByRole('button', { name: /모니터|노트북|라우터/ });
    expect(formElements.length).toBeGreaterThan(0);
  });
});
