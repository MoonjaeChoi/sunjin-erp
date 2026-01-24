// Generated: 2026-01-25 00:30:00 KST

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DayDetailPanel } from '@/components/features/dashboard/DayDetailPanel';
import { renderWithProviders } from '@/__tests__/test-utils';

const mockSetSelectedDate = jest.fn();
jest.mock('@/stores/useCalendarStore', () => ({
  useCalendarStore: () => ({
    setSelectedDate: mockSetSelectedDate,
  }),
}));

const mockMutate = jest.fn();
const mockUseDailySummaryQuery = jest.fn();
jest.mock('@/hooks/dashboard', () => ({
  useDailySummaryQuery: (...args: any[]) => mockUseDailySummaryQuery(...args),
  useUpdateTaskMutation: () => ({
    mutate: mockMutate,
    isPending: false,
  }),
}));

describe('DayDetailPanel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseDailySummaryQuery.mockReturnValue({
      data: {
        date: '2026-01-15',
        tasks: [],
        techSupports: [],
      },
      isLoading: false,
    });
  });

  it('should display date in Korean format', () => {
    renderWithProviders(<DayDetailPanel date="2026-01-15" />);
    expect(screen.getByText(/2026년 1월 15일/)).toBeInTheDocument();
  });

  it('should render task list with status badges', () => {
    mockUseDailySummaryQuery.mockReturnValue({
      data: {
        date: '2026-01-15',
        tasks: [
          { id: 1, title: 'Task 1', task_type: 'DOCUMENT', work_type: 'OFFICE', status: 'READY', start_time: 540, end_time: 600, customer_name: null },
          { id: 2, title: 'Task 2', task_type: 'MEETING', work_type: 'FIELD', status: 'DONE', start_time: null, end_time: null, customer_name: null },
        ],
        techSupports: [],
      },
      isLoading: false,
    });
    renderWithProviders(<DayDetailPanel date="2026-01-15" />);
    expect(screen.getByText('Task 1')).toBeInTheDocument();
    expect(screen.getByText('Task 2')).toBeInTheDocument();
    expect(screen.getByText('준비')).toBeInTheDocument();
    expect(screen.getByText('완료')).toBeInTheDocument();
  });

  it('should show empty tech support message', () => {
    renderWithProviders(<DayDetailPanel date="2026-01-15" />);
    expect(screen.getByText('기술지원 내역 없음')).toBeInTheDocument();
  });

  it('should close panel on X button click', async () => {
    const user = userEvent.setup();
    renderWithProviders(<DayDetailPanel date="2026-01-15" />);
    const closeButton = screen.getByRole('button');
    await user.click(closeButton);
    expect(mockSetSelectedDate).toHaveBeenCalledWith(null);
  });

  it('should allow status change via button click', async () => {
    const user = userEvent.setup();
    mockUseDailySummaryQuery.mockReturnValue({
      data: {
        date: '2026-01-15',
        tasks: [
          { id: 5, title: 'Change Me', task_type: 'DOCUMENT', work_type: 'OFFICE', status: 'READY', start_time: null, end_time: null, customer_name: null },
        ],
        techSupports: [],
      },
      isLoading: false,
    });
    renderWithProviders(<DayDetailPanel date="2026-01-15" />);
    // Click the status badge button (준비 → 진행)
    await user.click(screen.getByText('준비'));
    expect(mockMutate).toHaveBeenCalledWith({
      id: 5,
      dto: { status: 'IN_PROGRESS' },
    });
  });

  it('should show loading state', () => {
    mockUseDailySummaryQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
    });
    renderWithProviders(<DayDetailPanel date="2026-01-15" />);
    expect(screen.getByText('로딩 중...')).toBeInTheDocument();
  });

  it('should show empty task message when no tasks', () => {
    renderWithProviders(<DayDetailPanel date="2026-01-15" />);
    expect(screen.getByText('등록된 업무가 없습니다')).toBeInTheDocument();
  });
});
