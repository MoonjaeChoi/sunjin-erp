// Generated: 2026-01-25 04:20:00 KST

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TaskSearchFilters } from '@/components/features/tasks/TaskSearchFilters';
import { TaskSearchParams } from '@/types/task-search';

// Mock lucide-react
jest.mock('lucide-react', () => ({
  RotateCcw: () => React.createElement('svg', { 'data-testid': 'rotate-icon' }),
}));

// Mock Select to simplify testing (radix portals are complex in jsdom)
jest.mock('@/components/ui/select', () => ({
  Select: ({ value, onValueChange, children }: any) =>
    React.createElement('div', { 'data-testid': 'select-wrapper' }, children),
  SelectTrigger: ({ children }: any) =>
    React.createElement('button', { 'data-testid': 'select-trigger' }, children),
  SelectValue: ({ placeholder }: any) =>
    React.createElement('span', null, placeholder),
  SelectContent: ({ children }: any) =>
    React.createElement('div', { 'data-testid': 'select-content' }, children),
  SelectItem: ({ value, children }: any) =>
    React.createElement('option', { value }, children),
}));

describe('TaskSearchFilters', () => {
  const mockOnUpdate = jest.fn();
  const defaultParams: TaskSearchParams = {
    date_from: '2026-01-01',
    date_to: '2026-01-31',
    page: 1,
    page_size: 20,
    sort_by: 'task_date',
    sort_order: 'DESC',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should render heading and labels', () => {
    render(<TaskSearchFilters params={defaultParams} onUpdate={mockOnUpdate} />);
    expect(screen.getByText('업무 검색')).toBeInTheDocument();
    expect(screen.getByText('시작일')).toBeInTheDocument();
    expect(screen.getByText('종료일')).toBeInTheDocument();
    expect(screen.getByText('업무 유형')).toBeInTheDocument();
    expect(screen.getByText('근무 형태')).toBeInTheDocument();
    expect(screen.getByText('상태')).toBeInTheDocument();
  });

  it('should render date inputs with correct values', () => {
    render(<TaskSearchFilters params={defaultParams} onUpdate={mockOnUpdate} />);
    const dateInputs = screen.getAllByDisplayValue('2026-01-01');
    expect(dateInputs).toHaveLength(1);
    expect(screen.getByDisplayValue('2026-01-31')).toBeInTheDocument();
  });

  it('should render keyword input', () => {
    render(<TaskSearchFilters params={defaultParams} onUpdate={mockOnUpdate} />);
    expect(screen.getByPlaceholderText('검색어를 입력하세요...')).toBeInTheDocument();
  });

  it('should debounce keyword input (500ms)', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(<TaskSearchFilters params={defaultParams} onUpdate={mockOnUpdate} />);

    const keywordInput = screen.getByPlaceholderText('검색어를 입력하세요...');
    await user.type(keywordInput, '테스트');

    // Not yet called
    expect(mockOnUpdate).not.toHaveBeenCalled();

    // Advance past debounce
    jest.advanceTimersByTime(500);
    expect(mockOnUpdate).toHaveBeenCalledWith({ keyword: '테스트' });
  });

  it('should debounce date input changes (300ms)', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(<TaskSearchFilters params={defaultParams} onUpdate={mockOnUpdate} />);

    const dateFromInput = screen.getByDisplayValue('2026-01-01');
    await user.clear(dateFromInput);
    await user.type(dateFromInput, '2026-01-05');

    expect(mockOnUpdate).not.toHaveBeenCalled();

    jest.advanceTimersByTime(300);
    expect(mockOnUpdate).toHaveBeenCalledWith({ date_from: '2026-01-05' });
  });

  it('should show error when date_from > date_to', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    const params = { ...defaultParams, date_from: '2026-02-01', date_to: '2026-01-01' };
    render(<TaskSearchFilters params={params} onUpdate={mockOnUpdate} />);

    expect(screen.getByText('시작일이 종료일보다 늦습니다.')).toBeInTheDocument();
  });

  it('should show error when date range > 365 days', () => {
    const params = { ...defaultParams, date_from: '2025-01-01', date_to: '2026-01-31' };
    render(<TaskSearchFilters params={params} onUpdate={mockOnUpdate} />);

    expect(screen.getByText('검색 기간은 최대 1년입니다.')).toBeInTheDocument();
  });

  it('should not show date error for valid range', () => {
    render(<TaskSearchFilters params={defaultParams} onUpdate={mockOnUpdate} />);
    expect(screen.queryByText('시작일이 종료일보다 늦습니다.')).not.toBeInTheDocument();
    expect(screen.queryByText('검색 기간은 최대 1년입니다.')).not.toBeInTheDocument();
  });

  it('should reset all filters on reset button click', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    const params: TaskSearchParams = {
      ...defaultParams,
      type: 'DOCUMENT',
      keyword: '검색',
    };
    render(<TaskSearchFilters params={params} onUpdate={mockOnUpdate} />);

    const resetButton = screen.getByText('초기화');
    await user.click(resetButton);

    expect(mockOnUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        type: undefined,
        work_type: undefined,
        status: undefined,
        keyword: undefined,
      })
    );
  });

  it('should not call onUpdate for invalid date changes', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(<TaskSearchFilters params={defaultParams} onUpdate={mockOnUpdate} />);

    // Set date_from to after date_to
    const dateFromInput = screen.getByDisplayValue('2026-01-01');
    await user.clear(dateFromInput);
    await user.type(dateFromInput, '2026-02-15');

    jest.advanceTimersByTime(300);
    // Should not trigger onUpdate because date_from > date_to
    expect(mockOnUpdate).not.toHaveBeenCalled();
  });

  it('should sync local state when params change externally', () => {
    const { rerender } = render(
      <TaskSearchFilters params={defaultParams} onUpdate={mockOnUpdate} />
    );

    const newParams = { ...defaultParams, keyword: '새키워드' };
    rerender(<TaskSearchFilters params={newParams} onUpdate={mockOnUpdate} />);

    expect(screen.getByDisplayValue('새키워드')).toBeInTheDocument();
  });

  it('should call onUpdate with empty keyword as undefined', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    const params = { ...defaultParams, keyword: '기존' };
    render(<TaskSearchFilters params={params} onUpdate={mockOnUpdate} />);

    const keywordInput = screen.getByDisplayValue('기존');
    await user.clear(keywordInput);

    jest.advanceTimersByTime(500);
    expect(mockOnUpdate).toHaveBeenCalledWith({ keyword: undefined });
  });
});
