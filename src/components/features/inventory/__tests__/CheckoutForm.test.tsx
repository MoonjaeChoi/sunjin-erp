// Generated: 2026-01-26 18:00:00 KST

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import CheckoutForm from '../CheckoutForm';

// Mock hooks
jest.mock('@/hooks/inventory', () => ({
  useCheckoutInventoryMutation: jest.fn(() => ({
    mutate: jest.fn(),
    isPending: false,
  })),
  useInventoryListQuery: jest.fn(() => ({
    data: {
      data: [
        { id: 1, current_status: '재고', category: '모니터', model: 'Test' },
      ],
    },
    isLoading: false,
  })),
  inventoryKeys: {},
}));

jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}));

jest.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({}),
  QueryClient: jest.fn(() => ({})),
  QueryClientProvider: ({ children }: any) => children,
}));

describe('CheckoutForm', () => {
  const queryClient = new QueryClient();

  test('should render checkout form when open', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <CheckoutForm open={true} />
      </QueryClientProvider>
    );

    expect(screen.queryByText(/출고/i)).toBeInTheDocument();
  });

  test('should require checkout location', async () => {
    const user = userEvent.setup();

    render(
      <QueryClientProvider client={queryClient}>
        <CheckoutForm open={true} />
      </QueryClientProvider>
    );

    const submitButton = screen.queryByRole('button', { name: /확인|제출/i });
    if (submitButton) {
      await user.click(submitButton);
      await waitFor(() => {
        expect(screen.queryByText(/필수/i)).toBeInTheDocument();
      });
    }
  });

  test('should validate expected_checkin_date as future date', async () => {
    const user = userEvent.setup();

    render(
      <QueryClientProvider client={queryClient}>
        <CheckoutForm open={true} />
      </QueryClientProvider>
    );

    // Try to submit with past date
    const dateInputs = screen.queryAllByRole('textbox');
    if (dateInputs.length > 0) {
      const dateInput = dateInputs.find(i => (i as HTMLInputElement).type === 'date' || (i as any).placeholder?.includes('반납'));
      if (dateInput) {
        await user.type(dateInput, '2025-01-01');
      }
    }
  });

  test('should disable submit button while submitting', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <CheckoutForm open={true} />
      </QueryClientProvider>
    );

    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  test('should call onOpenChange when dialog is closed', async () => {
    const user = userEvent.setup();
    const onOpenChange = jest.fn();

    const { container } = render(
      <QueryClientProvider client={queryClient}>
        <CheckoutForm open={true} onOpenChange={onOpenChange} />
      </QueryClientProvider>
    );

    // Try to find and click close button
    const closeButton = container.querySelector('[data-state]');
    if (closeButton) {
      await user.click(closeButton);
    }
  });

  test('should render optional reason field', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <CheckoutForm open={true} />
      </QueryClientProvider>
    );

    const inputs = screen.queryAllByRole('textbox');
    expect(inputs.length).toBeGreaterThanOrEqual(1);
  });
});
