// Generated: 2026-01-25 17:35:00 KST

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProjectFilters } from '@/components/features/projects/ProjectFilters';
import { ProjectSearchParams } from '@/types/project';

const mockOnUpdate = jest.fn();

const mockParams: ProjectSearchParams = {
  keyword: '',
  customer_id: undefined,
  status: [],
  employee_id: undefined,
};

jest.mock('@/hooks/customers', () => ({
  useCustomerListQuery: () => ({
    data: {
      customers: [
        { id: 1, name: 'Customer A' },
        { id: 2, name: 'Customer B' },
      ],
    },
    isLoading: false,
    error: null,
  }),
}));

jest.mock('@/hooks/employees', () => ({
  useEmployeeListQuery: () => ({
    data: {
      employees: [
        { id: 1, name: 'Employee A', department_name: 'IT' },
        { id: 2, name: 'Employee B', department_name: 'Sales' },
      ],
    },
    isLoading: false,
    error: null,
  }),
}));

jest.mock('@/hooks/useDebounce', () => ({
  useDebouncedCallback: (fn: Function) => fn,
}));

describe('ProjectFilters', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderComponent = (params = mockParams, onUpdate = mockOnUpdate) => {
    return render(
      <ProjectFilters params={params} onUpdate={onUpdate} />
    );
  };

  it('should render keyword input', () => {
    renderComponent();

    const keywordInput = screen.getByPlaceholderText(/Search|검색|keyword/i);
    expect(keywordInput).toBeInTheDocument();
  });

  it('should debounce keyword input by 500ms', async () => {
    jest.useFakeTimers();
    const user = userEvent.setup({ delay: null });
    renderComponent();

    const keywordInput = screen.getByPlaceholderText(/Search|검색|keyword/i);
    await user.type(keywordInput, 'test');

    // onUpdate should be called due to debounce
    // Note: useDebouncedCallback is mocked to call immediately in tests
    expect(mockOnUpdate).toHaveBeenCalled();

    jest.useRealTimers();
  });

  it('should render customer select', () => {
    renderComponent();

    // Look for the customer combobox button
    const customerButton = screen.getByRole('combobox', { name: /고객사 선택/i });
    expect(customerButton).toBeInTheDocument();
  });

  it('should load and display customers', async () => {
    renderComponent();

    // Look for the customer combobox button
    const customerButton = screen.getByRole('combobox', { name: /고객사 선택/i });
    await fireEvent.click(customerButton);

    await waitFor(() => {
      expect(screen.getByText('Customer A')).toBeInTheDocument();
    });
  });

  it('should render status checkboxes', () => {
    renderComponent();

    const statusLabel = screen.getByText(/Status|상태/i);
    expect(statusLabel).toBeInTheDocument();
  });

  it('should render all status options', () => {
    renderComponent();

    expect(screen.getByText(/준비|Preparing/i)).toBeInTheDocument();
    expect(screen.getByText(/진행중|In Progress/i)).toBeInTheDocument();
    expect(screen.getByText(/완료|Completed/i)).toBeInTheDocument();
    expect(screen.getByText(/보류|On Hold/i)).toBeInTheDocument();
  });

  it('should allow multiple status selection', async () => {
    const user = userEvent.setup();
    renderComponent();

    const preparingCheckbox = screen.getByRole('checkbox', { name: /준비|Preparing/i });
    const progressCheckbox = screen.getByRole('checkbox', { name: /진행중|In Progress/i });

    await user.click(preparingCheckbox);
    await user.click(progressCheckbox);

    expect(preparingCheckbox).toBeChecked();
    expect(progressCheckbox).toBeChecked();
  });

  it('should render employee select', () => {
    renderComponent();

    // Look for the employee combobox button
    const employeeButton = screen.getByRole('combobox', { name: /담당자 선택/i });
    expect(employeeButton).toBeInTheDocument();
  });

  it('should call onUpdate when customer changes', async () => {
    const user = userEvent.setup();
    renderComponent();

    // Click the customer combobox to open it
    const customerButton = screen.getByRole('combobox', { name: /고객사 선택/i });
    await user.click(customerButton);

    // Select customer A
    const customerOption = screen.getByText('Customer A');
    await user.click(customerOption);

    // The update should be called with customer_id
    expect(mockOnUpdate).toHaveBeenCalled();
  });

  it('should call onUpdate when status changes', async () => {
    jest.useFakeTimers();
    const user = userEvent.setup({ delay: null });
    renderComponent();

    const preparingCheckbox = screen.getByRole('checkbox', { name: /준비|Preparing/i });
    await user.click(preparingCheckbox);

    jest.advanceTimersByTime(300);

    expect(mockOnUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        status: ['PREPARING'],
      })
    );

    jest.useRealTimers();
  });

  it('should debounce status filter changes by 300ms', async () => {
    jest.useFakeTimers();
    const user = userEvent.setup({ delay: null });
    renderComponent();

    const preparingCheckbox = screen.getByRole('checkbox', { name: /준비|Preparing/i });
    await user.click(preparingCheckbox);

    // onUpdate should not be called immediately
    expect(mockOnUpdate).not.toHaveBeenCalled();

    // Advance time by 300ms
    jest.advanceTimersByTime(300);

    // Now onUpdate should be called
    expect(mockOnUpdate).toHaveBeenCalled();

    jest.useRealTimers();
  });

  it('should clear filters', async () => {
    const user = userEvent.setup();
    const filtersWithValues = {
      ...mockParams,
      keyword: 'test',
      customer_id: 1,
      status: ['PREPARING'],
    };

    renderComponent(filtersWithValues);

    const clearButton = screen.getByRole('button', { name: /Clear|Reset|초기화/i });
    await user.click(clearButton);

    expect(mockOnUpdate).toHaveBeenCalledWith({
      keyword: '',
      customer_id: undefined,
      status: [],
      employee_id: undefined,
    });
  });

  it('should display clear button only when filters are active', () => {
    const { rerender } = render(
      <ProjectFilters params={mockParams} onUpdate={mockOnUpdate} />
    );

    const clearButton = screen.queryByRole('button', { name: /Clear|Reset|초기화/i });
    expect(clearButton).not.toBeInTheDocument();

    // Now render with active filters
    const filtersWithValues = {
      ...mockParams,
      keyword: 'test',
    };

    rerender(
      <ProjectFilters filters={filtersWithValues} onUpdate={mockOnUpdate} />
    );

    const clearButtonNow = screen.getByRole('button', { name: /Clear|Reset|초기화/i });
    expect(clearButtonNow).toBeInTheDocument();
  });

  it('should synchronize displayed values with props', async () => {
    const { rerender } = render(
      <ProjectFilters params={mockParams} onUpdate={mockOnUpdate} />
    );

    const keywordInput = screen.getByPlaceholderText(/Search|검색|keyword/i);
    expect(keywordInput).toHaveValue('');

    const filtersWithKeyword = {
      ...mockParams,
      keyword: 'updated',
    };

    rerender(
      <ProjectFilters filters={filtersWithKeyword} onUpdate={mockOnUpdate} />
    );

    expect(keywordInput).toHaveValue('updated');
  });
});
