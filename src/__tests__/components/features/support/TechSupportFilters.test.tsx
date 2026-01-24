// Generated: 2026-01-25 06:40:00 KST

import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TechSupportFilters } from '@/components/features/support/TechSupportFilters';
import { TechSupportSearchParams } from '@/types/tech-support';

jest.mock('lucide-react', () => ({
  RotateCcw: () => React.createElement('svg', { 'data-testid': 'rotate-ccw' }),
  ChevronsUpDown: () => React.createElement('svg', { 'data-testid': 'chevrons-updown' }),
  Check: () => React.createElement('svg', { 'data-testid': 'check-icon' }),
}));

jest.mock('@/components/ui/select', () => ({
  Select: ({ children, onValueChange, value }: any) =>
    React.createElement('div', { 'data-testid': `select-${value}` }, children),
  SelectTrigger: ({ children }: any) => React.createElement('button', null, children),
  SelectValue: ({ placeholder }: any) => React.createElement('span', null, placeholder),
  SelectContent: ({ children }: any) => React.createElement('div', null, children),
  SelectItem: ({ children, value }: any) => React.createElement('option', { value }, children),
}));

const mockCustomerData = {
  customers: [
    { id: 1, name: '삼성전자' },
    { id: 2, name: 'LG전자' },
  ],
};

jest.mock('@/hooks/customers', () => ({
  useCustomerListQuery: () => ({ data: mockCustomerData }),
}));

jest.mock('@/lib/utils', () => ({
  cn: (...args: any[]) => args.filter(Boolean).join(' '),
}));

describe('TechSupportFilters', () => {
  const mockOnUpdate = jest.fn();
  const defaultParams: TechSupportSearchParams = {
    date_from: '2026-01-01',
    date_to: '2026-01-31',
    page: 1,
    page_size: 20,
    sort_by: 'support_date',
    sort_order: 'DESC',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render filter labels', () => {
    render(<TechSupportFilters params={defaultParams} onUpdate={mockOnUpdate} />);
    expect(screen.getByText('시작일')).toBeInTheDocument();
    expect(screen.getByText('종료일')).toBeInTheDocument();
    expect(screen.getByText('고객사')).toBeInTheDocument();
    expect(screen.getByText('지원 유형')).toBeInTheDocument();
    expect(screen.getByText('지원 방법')).toBeInTheDocument();
    expect(screen.getByText('상태')).toBeInTheDocument();
  });

  it('should render date inputs with param values', () => {
    render(<TechSupportFilters params={defaultParams} onUpdate={mockOnUpdate} />);
    expect(screen.getByDisplayValue('2026-01-01')).toBeInTheDocument();
    expect(screen.getByDisplayValue('2026-01-31')).toBeInTheDocument();
  });

  it('should debounce date change and call onUpdate', () => {
    jest.useFakeTimers();
    render(<TechSupportFilters params={defaultParams} onUpdate={mockOnUpdate} />);

    const dateFromInput = screen.getByDisplayValue('2026-01-01');
    fireEvent.change(dateFromInput, { target: { value: '2026-01-10' } });

    expect(mockOnUpdate).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(300);
    });

    expect(mockOnUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ date_from: '2026-01-10', page: 1 })
    );
    jest.useRealTimers();
  });

  it('should debounce keyword change (500ms)', () => {
    jest.useFakeTimers();
    render(<TechSupportFilters params={defaultParams} onUpdate={mockOnUpdate} />);

    const keywordInput = screen.getByPlaceholderText('검색어를 입력하세요...');
    fireEvent.change(keywordInput, { target: { value: '테스트' } });

    act(() => {
      jest.advanceTimersByTime(499);
    });
    expect(mockOnUpdate).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(1);
    });
    expect(mockOnUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ keyword: '테스트', page: 1 })
    );
    jest.useRealTimers();
  });

  it('should not call onUpdate for keyword less than 2 chars', () => {
    jest.useFakeTimers();
    render(<TechSupportFilters params={defaultParams} onUpdate={mockOnUpdate} />);

    const keywordInput = screen.getByPlaceholderText('검색어를 입력하세요...');
    fireEvent.change(keywordInput, { target: { value: 'a' } });

    act(() => {
      jest.advanceTimersByTime(500);
    });
    expect(mockOnUpdate).not.toHaveBeenCalled();
    jest.useRealTimers();
  });

  it('should show date error when start date is after end date', () => {
    const invalidParams = { ...defaultParams, date_from: '2026-02-01', date_to: '2026-01-01' };
    render(<TechSupportFilters params={invalidParams} onUpdate={mockOnUpdate} />);
    expect(screen.getByText('시작일이 종료일보다 늦습니다.')).toBeInTheDocument();
  });

  it('should show date error when range exceeds 365 days', () => {
    const invalidParams = { ...defaultParams, date_from: '2024-01-01', date_to: '2026-01-31' };
    render(<TechSupportFilters params={invalidParams} onUpdate={mockOnUpdate} />);
    expect(screen.getByText('검색 기간은 최대 1년입니다.')).toBeInTheDocument();
  });

  it('should open customer combobox on click', async () => {
    const user = userEvent.setup();
    render(<TechSupportFilters params={defaultParams} onUpdate={mockOnUpdate} />);

    const customerLabel = screen.getByText('고객사');
    const comboButton = customerLabel.closest('.space-y-1')!.querySelector('button')!;
    await user.click(comboButton);
    expect(screen.getByPlaceholderText('고객사 검색...')).toBeInTheDocument();
  });

  it('should select customer from combobox', async () => {
    const user = userEvent.setup();
    render(<TechSupportFilters params={defaultParams} onUpdate={mockOnUpdate} />);

    const customerLabel = screen.getByText('고객사');
    const comboButton = customerLabel.closest('.space-y-1')!.querySelector('button')!;
    await user.click(comboButton);

    const samsungOption = screen.getByText('삼성전자');
    await user.click(samsungOption);

    expect(mockOnUpdate).toHaveBeenCalledWith({ customer_id: 1, page: 1 });
  });

  it('should call onUpdate with reset values', async () => {
    const user = userEvent.setup();
    render(<TechSupportFilters params={defaultParams} onUpdate={mockOnUpdate} />);

    const resetButton = screen.getByText('초기화');
    await user.click(resetButton);

    expect(mockOnUpdate).toHaveBeenCalledWith(expect.objectContaining({
      customer_id: undefined,
      support_type: undefined,
      support_method: undefined,
      status: undefined,
      keyword: undefined,
      page: 1,
    }));
  });

  it('should filter customer list by search', async () => {
    const user = userEvent.setup();
    render(<TechSupportFilters params={defaultParams} onUpdate={mockOnUpdate} />);

    const customerLabel = screen.getByText('고객사');
    const comboButton = customerLabel.closest('.space-y-1')!.querySelector('button')!;
    await user.click(comboButton);

    const searchInput = screen.getByPlaceholderText('고객사 검색...');
    await user.type(searchInput, '삼성');

    expect(screen.getByText('삼성전자')).toBeInTheDocument();
    expect(screen.queryByText('LG전자')).not.toBeInTheDocument();
  });
});
