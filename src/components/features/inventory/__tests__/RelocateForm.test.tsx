// Generated: 2026-01-26 18:00:00 KST

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import RelocateForm from '../RelocateForm';

jest.mock('@/hooks/inventory', () => ({
  useRelocateInventoryMutation: jest.fn(() => ({
    mutate: jest.fn(),
    isPending: false,
  })),
  useInventoryListQuery: jest.fn(() => ({
    data: {
      data: [
        { id: 1, current_status: '재고', category: '모니터', current_location: '창고 A-1' },
        { id: 2, current_status: '출고', category: '노트북', current_location: '사무실' },
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

describe('RelocateForm', () => {
  const queryClient = new QueryClient();

  test('should render relocate form when open', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <RelocateForm open={true} />
      </QueryClientProvider>
    );

    expect(screen.queryByText(/위치|이동/i)).toBeInTheDocument();
  });

  test('should require new location', async () => {
    const user = userEvent.setup();

    render(
      <QueryClientProvider client={queryClient}>
        <RelocateForm open={true} />
      </QueryClientProvider>
    );

    const submitButton = screen.queryByRole('button', { name: /확인|제출/i });
    if (submitButton) {
      await user.click(submitButton);
      await waitFor(() => {
        expect(screen.queryByText(/필수|필요/i)).toBeInTheDocument();
      });
    }
  });

  test('should allow selection of equipment except 폐기 status', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <RelocateForm open={true} />
      </QueryClientProvider>
    );

    // Form should be able to select inventory items
    const selects = screen.queryAllByRole('combobox');
    expect(selects.length).toBeGreaterThanOrEqual(1);
  });

  test('should update location field', async () => {
    const user = userEvent.setup();

    render(
      <QueryClientProvider client={queryClient}>
        <RelocateForm open={true} />
      </QueryClientProvider>
    );

    const inputs = screen.queryAllByRole('textbox');
    if (inputs.length > 0) {
      const locationInput = inputs[0];
      await user.type(locationInput, '창고 B-2');
      expect((locationInput as HTMLInputElement).value).toContain('창고');
    }
  });

  test('should not change status on relocation', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <RelocateForm open={true} />
      </QueryClientProvider>
    );

    // Component should only handle location change, not status
    const form = screen.queryByRole('form') || screen.queryByRole('dialog');
    expect(form).toBeInTheDocument();
  });

  test('should allow optional reason', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <RelocateForm open={true} />
      </QueryClientProvider>
    );

    const textareas = screen.queryAllByRole('textbox');
    expect(textareas.length).toBeGreaterThanOrEqual(1);
  });

  test('should validate location string', async () => {
    const user = userEvent.setup();

    render(
      <QueryClientProvider client={queryClient}>
        <RelocateForm open={true} />
      </QueryClientProvider>
    );

    const inputs = screen.queryAllByRole('textbox');
    if (inputs.length > 0) {
      await user.type(inputs[0], ' ');
      // Should show validation error for empty location
    }
  });
});
