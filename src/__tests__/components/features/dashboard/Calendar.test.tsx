// Generated: 2026-01-25 00:30:00 KST

import React from 'react';
import { render, screen } from '@testing-library/react';
import { Calendar } from '@/components/features/dashboard/Calendar';
import { renderWithProviders } from '@/__tests__/test-utils';

const mockPush = jest.fn();
let mockSearchParams = new URLSearchParams('');

jest.mock('next/navigation', () => ({
  useSearchParams: () => mockSearchParams,
  useRouter: () => ({ push: mockPush }),
}));

jest.mock('@/stores/useCalendarStore', () => ({
  useCalendarStore: () => ({
    selectedDate: null,
    taskFormOpen: false,
    editingTaskId: null,
    closeTaskForm: jest.fn(),
    setSelectedDate: jest.fn(),
    openTaskForm: jest.fn(),
  }),
}));

jest.mock('@/hooks/dashboard', () => ({
  useTasksQuery: () => ({
    data: { tasks: [], total: 0 },
    isLoading: false,
  }),
  useCreateTaskMutation: () => ({ mutate: jest.fn(), isPending: false }),
  useUpdateTaskMutation: () => ({ mutate: jest.fn(), isPending: false }),
  useDeleteTaskMutation: () => ({ mutate: jest.fn(), isPending: false }),
}));

jest.mock('@/hooks/useMediaQuery', () => ({
  useMediaQuery: () => true,
}));

describe('Calendar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSearchParams = new URLSearchParams('');
  });

  it('should render MonthView by default (no view param)', () => {
    renderWithProviders(<Calendar />);
    // MonthView renders day-of-week headers (화~일 are unique)
    expect(screen.getByText('화')).toBeInTheDocument();
    expect(screen.getByText('수')).toBeInTheDocument();
    // CalendarHeader should show 월 tab as active
    expect(screen.getByRole('tab', { name: '월' })).toHaveAttribute(
      'data-state',
      'active'
    );
  });

  it('should render WeekView when view=week', () => {
    mockSearchParams = new URLSearchParams('view=week&date=2026-01-15');
    renderWithProviders(<Calendar />);
    // WeekView shows day labels with locale format
    expect(screen.getByText(/1월 13일/)).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: '주' })).toHaveAttribute(
      'data-state',
      'active'
    );
  });

  it('should render DayView when view=day', () => {
    mockSearchParams = new URLSearchParams('view=day&date=2026-01-15');
    renderWithProviders(<Calendar />);
    // DayView shows empty message when no tasks
    expect(screen.getByText('등록된 업무가 없습니다')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: '일' })).toHaveAttribute(
      'data-state',
      'active'
    );
  });

  it('should pass date from URL to header', () => {
    mockSearchParams = new URLSearchParams('date=2026-03-10');
    renderWithProviders(<Calendar />);
    expect(screen.getByText('2026년 3월')).toBeInTheDocument();
  });

  it('should render CalendarHeader with view tabs', () => {
    renderWithProviders(<Calendar />);
    expect(screen.getByRole('tab', { name: '월' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: '주' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: '일' })).toBeInTheDocument();
  });
});
