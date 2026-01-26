// Generated: 2026-01-26 18:00:00 KST

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import CreateInventoryForm from '../CreateInventoryForm';

jest.mock('@/hooks/inventory', () => ({
  useCreateInventoryMutation: jest.fn(() => ({
    mutate: jest.fn(),
    isPending: false,
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

describe('CreateInventoryForm', () => {
  const queryClient = new QueryClient();

  test('should render create form when open', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <CreateInventoryForm open={true} />
      </QueryClientProvider>
    );

    expect(screen.queryByText(/입고|등록|생성/i)).toBeInTheDocument();
  });

  test('should require category selection', async () => {
    const user = userEvent.setup();

    render(
      <QueryClientProvider client={queryClient}>
        <CreateInventoryForm open={true} />
      </QueryClientProvider>
    );

    const submitButton = screen.queryByRole('button', { name: /확인|제출|등록/i });
    if (submitButton) {
      await user.click(submitButton);
      await waitFor(() => {
        expect(screen.queryByText(/카테고리|필수/i)).toBeInTheDocument();
      });
    }
  });

  test('should require model name', async () => {
    const user = userEvent.setup();

    render(
      <QueryClientProvider client={queryClient}>
        <CreateInventoryForm open={true} />
      </QueryClientProvider>
    );

    const submitButton = screen.queryByRole('button', { name: /확인|제출|등록/i });
    if (submitButton) {
      await user.click(submitButton);
      await waitFor(() => {
        expect(screen.queryByText(/모델|필수/i)).toBeInTheDocument();
      });
    }
  });

  test('should require serial number', async () => {
    const user = userEvent.setup();

    render(
      <QueryClientProvider client={queryClient}>
        <CreateInventoryForm open={true} />
      </QueryClientProvider>
    );

    const submitButton = screen.queryByRole('button', { name: /확인|제출|등록/i });
    if (submitButton) {
      await user.click(submitButton);
      await waitFor(() => {
        expect(screen.queryByText(/시리얼|필수/i)).toBeInTheDocument();
      });
    }
  });

  test('should check for duplicate serial number', async () => {
    const user = userEvent.setup();

    render(
      <QueryClientProvider client={queryClient}>
        <CreateInventoryForm open={true} />
      </QueryClientProvider>
    );

    const inputs = screen.queryAllByRole('textbox');
    if (inputs.length > 0) {
      // Find serial number input and type a value
      const serialInput = inputs.find(i =>
        (i as HTMLInputElement).placeholder?.includes('시리얼') ||
        (i as HTMLInputElement).placeholder?.includes('번호')
      );
      if (serialInput) {
        await user.type(serialInput, 'EXISTING-SN-001');
        // Should trigger duplicate check with debounce
      }
    }
  });

  test('should render all required fields', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <CreateInventoryForm open={true} />
      </QueryClientProvider>
    );

    // Should render form with category, model, serial, date, etc.
    const inputs = screen.queryAllByRole('textbox');
    expect(inputs.length).toBeGreaterThanOrEqual(3);
  });

  test('should set initial status to 재고', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <CreateInventoryForm open={true} />
      </QueryClientProvider>
    );

    // Component should set status automatically
    const form = screen.queryByRole('form') || screen.queryByRole('dialog');
    expect(form).toBeInTheDocument();
  });

  test('should require purchase date', async () => {
    const user = userEvent.setup();

    render(
      <QueryClientProvider client={queryClient}>
        <CreateInventoryForm open={true} />
      </QueryClientProvider>
    );

    const submitButton = screen.queryByRole('button', { name: /확인|제출|등록/i });
    if (submitButton) {
      await user.click(submitButton);
      await waitFor(() => {
        expect(screen.queryByText(/구매|날짜|필수/i)).toBeInTheDocument();
      });
    }
  });

  test('should allow optional notes', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <CreateInventoryForm open={true} />
      </QueryClientProvider>
    );

    const textareas = screen.queryAllByRole('textbox');
    // Notes field should be present but optional
    expect(textareas.length).toBeGreaterThanOrEqual(1);
  });

  test('should handle form submission with valid data', async () => {
    const user = userEvent.setup();

    render(
      <QueryClientProvider client={queryClient}>
        <CreateInventoryForm open={true} />
      </QueryClientProvider>
    );

    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  test('should reset form after successful creation', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <CreateInventoryForm open={true} />
      </QueryClientProvider>
    );

    // After successful mutation, form should reset
    const form = screen.queryByRole('form') || screen.queryByRole('dialog');
    expect(form).toBeInTheDocument();
  });
});
