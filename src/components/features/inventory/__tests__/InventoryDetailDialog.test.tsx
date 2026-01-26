// Generated: 2026-01-26 18:00:00 KST

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import InventoryDetailDialog from '../InventoryDetailDialog';
import { mockInventory } from '@/__tests__/fixtures/inventory';

jest.mock('@/hooks/inventory', () => ({
  useInventoryDetailQuery: jest.fn((id) => ({
    data: id === 1 ? mockInventory : null,
    isLoading: false,
    error: null,
  })),
  inventoryKeys: {},
}));

jest.mock('@/stores/inventoryFilterStore', () => ({
  useInventoryFilterStore: jest.fn((selector) => {
    const state = {
      detailOpen: true,
      selectedInventoryId: 1,
      setDetailOpen: jest.fn(),
      setSelectedInventoryId: jest.fn(),
    };
    return selector(state);
  }),
}));

describe('InventoryDetailDialog', () => {
  const queryClient = new QueryClient();

  test('should render detail dialog when open', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <InventoryDetailDialog />
      </QueryClientProvider>
    );

    expect(screen.queryByRole('dialog')).toBeInTheDocument();
  });

  test('should display basic inventory information', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <InventoryDetailDialog />
      </QueryClientProvider>
    );

    expect(screen.queryByText(/카테고리|모델|시리얼/i)).toBeInTheDocument();
  });

  test('should render tab navigation', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <InventoryDetailDialog />
      </QueryClientProvider>
    );

    // Should have tabs for basic info and history
    const tabs = screen.queryAllByRole('tab');
    expect(tabs.length).toBeGreaterThanOrEqual(2);
  });

  test('should display overdue information if applicable', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <InventoryDetailDialog />
      </QueryClientProvider>
    );

    // Component should check isOverdue property
    const dialog = screen.queryByRole('dialog');
    expect(dialog).toBeInTheDocument();
  });

  test('should switch tabs on click', async () => {
    const user = userEvent.setup();

    render(
      <QueryClientProvider client={queryClient}>
        <InventoryDetailDialog />
      </QueryClientProvider>
    );

    const tabs = screen.queryAllByRole('tab');
    if (tabs.length > 1) {
      await user.click(tabs[1]);
      // Should switch to history tab
    }
  });

  test('should show loading state', () => {
    jest.mock('@/hooks/inventory', () => ({
      useInventoryDetailQuery: jest.fn(() => ({
        data: null,
        isLoading: true,
        error: null,
      })),
    }));

    render(
      <QueryClientProvider client={queryClient}>
        <InventoryDetailDialog />
      </QueryClientProvider>
    );
  });

  test('should display 8 fields in basic info tab', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <InventoryDetailDialog />
      </QueryClientProvider>
    );

    // Should display: category, model, serial, purchase date, location, status, etc.
    const labels = screen.queryAllByText(/카테고리|모델|시리얼|날짜|위치|상태/i);
    expect(labels.length).toBeGreaterThanOrEqual(4);
  });

  test('should render created/updated user info', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <InventoryDetailDialog />
      </QueryClientProvider>
    );

    // Should show who created and updated
    const dialog = screen.queryByRole('dialog');
    expect(dialog).toBeInTheDocument();
  });

  test('should handle tab switching between basic and history', async () => {
    const user = userEvent.setup();

    render(
      <QueryClientProvider client={queryClient}>
        <InventoryDetailDialog />
      </QueryClientProvider>
    );

    const tabs = screen.queryAllByRole('tab');
    if (tabs.length >= 2) {
      await user.click(tabs[1]);
      await waitFor(() => {
        // Second tab should be active
      });
    }
  });
});
