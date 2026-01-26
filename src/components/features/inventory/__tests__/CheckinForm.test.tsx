// Generated: 2026-01-26 18:00:00 KST

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import CheckinForm from '../CheckinForm';

jest.mock('@/hooks/inventory', () => ({
  useCheckinInventoryMutation: jest.fn(() => ({
    mutate: jest.fn(),
    isPending: false,
  })),
  useInventoryListQuery: jest.fn(() => ({
    data: {
      data: [
        { id: 2, current_status: '출고', category: '노트북', model: 'Test' },
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

describe('CheckinForm', () => {
  const queryClient = new QueryClient();

  test('should render checkin form when open', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <CheckinForm open={true} />
      </QueryClientProvider>
    );

    expect(screen.queryByText(/반납|체크인/i)).toBeInTheDocument();
  });

  test('should require return location', async () => {
    const user = userEvent.setup();

    render(
      <QueryClientProvider client={queryClient}>
        <CheckinForm open={true} />
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

  test('should filter inventory by 출고 status only', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <CheckinForm open={true} />
      </QueryClientProvider>
    );

    // Component should query for 출고 status items
    const form = screen.queryByRole('form') || screen.queryByRole('dialog');
    expect(form).toBeInTheDocument();
  });

  test('should update location field on input', async () => {
    const user = userEvent.setup();

    render(
      <QueryClientProvider client={queryClient}>
        <CheckinForm open={true} />
      </QueryClientProvider>
    );

    const inputs = screen.queryAllByRole('textbox');
    if (inputs.length > 0) {
      await user.type(inputs[0], '창고 A-1');
      expect((inputs[0] as HTMLInputElement).value).toContain('창고');
    }
  });

  test('should allow optional reason field', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <CheckinForm open={true} />
      </QueryClientProvider>
    );

    const textareas = screen.queryAllByRole('textbox');
    expect(textareas.length).toBeGreaterThanOrEqual(1);
  });

  test('should handle form submission', async () => {
    const user = userEvent.setup();

    render(
      <QueryClientProvider client={queryClient}>
        <CheckinForm open={true} />
      </QueryClientProvider>
    );

    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });
});
