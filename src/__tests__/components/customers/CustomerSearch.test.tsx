// Generated: 2026-01-28 02:15:00 KST

jest.mock('@/hooks/useCustomers', () => ({
  useCustomerSearch: jest.fn(),
}));

jest.mock('lucide-react', () => ({
  Search: () => <span>Search Icon</span>,
  Plus: () => <span>Plus Icon</span>,
}));

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CustomerSearch } from '@/components/features/customers/CustomerSearch';
import { useCustomerSearch } from '@/hooks/useCustomers';

const mockUseCustomerSearch = useCustomerSearch as jest.Mock;

describe('CustomerSearch Component', () => {
  const mockOnSelect = jest.fn();
  const mockOnAddNew = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render search input', () => {
    mockUseCustomerSearch.mockReturnValue({
      data: [],
      isLoading: false,
    });

    render(
      <CustomerSearch
        onSelect={mockOnSelect}
        placeholder="고객 검색..."
      />
    );

    const input = screen.getByPlaceholderText('고객 검색...');
    expect(input).toBeInTheDocument();
  });

  it('should show results on search', async () => {
    mockUseCustomerSearch.mockReturnValue({
      data: [
        { id: 1, name: 'Customer A', code: 'CUS001', classification: 'END_USER' },
        { id: 2, name: 'Customer B', code: 'CUS002', classification: 'RESELLER' },
      ],
      isLoading: false,
    });

    render(
      <CustomerSearch
        onSelect={mockOnSelect}
        placeholder="고객 검색..."
      />
    );

    const input = screen.getByPlaceholderText('고객 검색...');
    fireEvent.change(input, { target: { value: 'Customer' } });
    fireEvent.focus(input);

    await waitFor(() => {
      expect(screen.getByText('Customer A')).toBeInTheDocument();
    });
  });

  it('should show loading state', async () => {
    mockUseCustomerSearch.mockReturnValue({
      data: [],
      isLoading: true,
    });

    render(
      <CustomerSearch
        onSelect={mockOnSelect}
        placeholder="고객 검색..."
      />
    );

    const input = screen.getByPlaceholderText('고객 검색...');
    fireEvent.change(input, { target: { value: 'Test' } });
    fireEvent.focus(input);

    await waitFor(() => {
      expect(screen.getByText('검색 중...')).toBeInTheDocument();
    });
  });

  it('should show empty state when no results', async () => {
    mockUseCustomerSearch.mockReturnValue({
      data: [],
      isLoading: false,
    });

    render(
      <CustomerSearch
        onSelect={mockOnSelect}
        placeholder="고객 검색..."
      />
    );

    const input = screen.getByPlaceholderText('고객 검색...');
    fireEvent.change(input, { target: { value: 'NonExistent' } });
    fireEvent.focus(input);

    await waitFor(() => {
      expect(screen.getByText('검색 결과가 없습니다')).toBeInTheDocument();
    });
  });

  it('should show add new button when provided', async () => {
    mockUseCustomerSearch.mockReturnValue({
      data: [],
      isLoading: false,
    });

    render(
      <CustomerSearch
        onSelect={mockOnSelect}
        onAddNew={mockOnAddNew}
        placeholder="고객 검색..."
      />
    );

    const input = screen.getByPlaceholderText('고객 검색...');
    fireEvent.change(input, { target: { value: 'New' } });
    fireEvent.focus(input);

    await waitFor(() => {
      expect(screen.getByText('새 고객 추가')).toBeInTheDocument();
    });
  });

  it('should call onSelect when result clicked', async () => {
    const customer = { id: 1, name: 'Customer A', code: 'CUS001', classification: 'END_USER' };
    mockUseCustomerSearch.mockReturnValue({
      data: [customer],
      isLoading: false,
    });

    render(
      <CustomerSearch
        onSelect={mockOnSelect}
        placeholder="고객 검색..."
      />
    );

    const input = screen.getByPlaceholderText('고객 검색...');
    fireEvent.change(input, { target: { value: 'Customer' } });
    fireEvent.focus(input);

    await waitFor(() => {
      const resultButton = screen.getByText('Customer A');
      fireEvent.click(resultButton);
    });

    expect(mockOnSelect).toHaveBeenCalledWith(customer);
  });

  it('should call onAddNew when add button clicked', async () => {
    mockUseCustomerSearch.mockReturnValue({
      data: [],
      isLoading: false,
    });

    render(
      <CustomerSearch
        onSelect={mockOnSelect}
        onAddNew={mockOnAddNew}
        placeholder="고객 검색..."
      />
    );

    const input = screen.getByPlaceholderText('고객 검색...');
    fireEvent.change(input, { target: { value: 'New' } });
    fireEvent.focus(input);

    await waitFor(() => {
      const addButton = screen.getByText('새 고객 추가');
      fireEvent.click(addButton);
    });

    expect(mockOnAddNew).toHaveBeenCalled();
  });

  it('should close dropdown on click outside', async () => {
    mockUseCustomerSearch.mockReturnValue({
      data: [
        { id: 1, name: 'Customer A', code: 'CUS001', classification: 'END_USER' },
      ],
      isLoading: false,
    });

    const { container } = render(
      <div>
        <CustomerSearch
          onSelect={mockOnSelect}
          placeholder="고객 검색..."
        />
        <div data-testid="outside">Outside element</div>
      </div>
    );

    const input = screen.getByPlaceholderText('고객 검색...');
    fireEvent.change(input, { target: { value: 'Customer' } });
    fireEvent.focus(input);

    await waitFor(() => {
      expect(screen.getByText('Customer A')).toBeInTheDocument();
    });

    const outside = screen.getByTestId('outside');
    fireEvent.mouseDown(outside);

    // After clicking outside, dropdown should close
    // The component should not be visible anymore
    expect(screen.queryByText('Customer A')).not.toBeInTheDocument();
  });

  it('should clear query after selection', async () => {
    const customer = { id: 1, name: 'Customer A', code: 'CUS001', classification: 'END_USER' };
    mockUseCustomerSearch.mockReturnValue({
      data: [customer],
      isLoading: false,
    });

    render(
      <CustomerSearch
        onSelect={mockOnSelect}
        placeholder="고객 검색..."
      />
    );

    const input = screen.getByPlaceholderText('고객 검색...') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'Customer' } });
    fireEvent.focus(input);

    await waitFor(() => {
      const resultButton = screen.getByText('Customer A');
      fireEvent.click(resultButton);
    });

    // After selection, input should be cleared
    expect(input.value).toBe('');
  });
});
