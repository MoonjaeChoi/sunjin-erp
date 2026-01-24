// Generated: 2026-01-25 00:30:00 KST

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TeamCalendar } from '@/components/features/dashboard/TeamCalendar';
import { renderWithProviders } from '@/__tests__/test-utils';

let mockIsDesktop = true;
jest.mock('@/hooks/useMediaQuery', () => ({
  useMediaQuery: () => mockIsDesktop,
}));

const mockSetEmployeeFilter = jest.fn();
jest.mock('@/stores/useCalendarStore', () => ({
  useCalendarStore: () => ({
    selectedEmployeeFilter: null,
    setEmployeeFilter: mockSetEmployeeFilter,
  }),
}));

const mockSearchParams = new URLSearchParams('date=2026-01-15');
jest.mock('next/navigation', () => ({
  useSearchParams: () => mockSearchParams,
}));

const mockUseTeamTasksQuery = jest.fn();
jest.mock('@/hooks/dashboard', () => ({
  useTeamTasksQuery: (...args: any[]) => mockUseTeamTasksQuery(...args),
}));

describe('TeamCalendar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockIsDesktop = true;
    mockUseTeamTasksQuery.mockReturnValue({
      data: {
        employees: [
          {
            employee_id: 1,
            employee_name: '김철수',
            tasks: [
              { id: 1, title: 'Task 1', task_date: '2026-01-15', start_time: 540, end_time: 600, task_type: 'DOCUMENT', work_type: 'OFFICE', status: 'READY' },
            ],
          },
          {
            employee_id: 2,
            employee_name: '박영희',
            tasks: [
              { id: 2, title: 'Task 2', task_date: '2026-01-16', start_time: null, end_time: null, task_type: 'MEETING', work_type: 'FIELD', status: 'DONE' },
            ],
          },
        ],
      },
      isLoading: false,
    });
  });

  it('should show mobile-only message under 768px', () => {
    mockIsDesktop = false;
    renderWithProviders(<TeamCalendar />);
    expect(
      screen.getByText('팀 캘린더는 데스크톱에서 이용해주세요.')
    ).toBeInTheDocument();
  });

  it('should render employee filter select on desktop', () => {
    renderWithProviders(<TeamCalendar />);
    expect(screen.getByText('전체 직원')).toBeInTheDocument();
  });

  it('should render 7 day-of-week headers', () => {
    renderWithProviders(<TeamCalendar />);
    expect(screen.getByText('월')).toBeInTheDocument();
    expect(screen.getByText('화')).toBeInTheDocument();
    expect(screen.getByText('수')).toBeInTheDocument();
    expect(screen.getByText('목')).toBeInTheDocument();
    expect(screen.getByText('금')).toBeInTheDocument();
    expect(screen.getByText('토')).toBeInTheDocument();
    expect(screen.getByText('일')).toBeInTheDocument();
  });

  it('should display task counts per employee per date', () => {
    renderWithProviders(<TeamCalendar />);
    const counts = screen.getAllByText('1건');
    expect(counts.length).toBeGreaterThanOrEqual(1);
  });

  it('should show loading state', () => {
    mockUseTeamTasksQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
    });
    renderWithProviders(<TeamCalendar />);
    expect(screen.getByText('로딩 중...')).toBeInTheDocument();
  });

  it('should not render calendar grid on mobile', () => {
    mockIsDesktop = false;
    const { container } = renderWithProviders(<TeamCalendar />);
    expect(container.querySelector('.grid-cols-7')).not.toBeInTheDocument();
  });
});
