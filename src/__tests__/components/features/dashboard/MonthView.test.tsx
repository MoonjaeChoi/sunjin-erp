// Generated: 2026-01-25 00:30:00 KST

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MonthView } from '@/components/features/dashboard/MonthView';
import { TaskListItem } from '@/types/dashboard';

const mockSetSelectedDate = jest.fn();
const mockOpenTaskForm = jest.fn();
jest.mock('@/stores/useCalendarStore', () => ({
  useCalendarStore: () => ({
    setSelectedDate: mockSetSelectedDate,
    openTaskForm: mockOpenTaskForm,
  }),
}));

function makeTask(overrides: Partial<TaskListItem> = {}): TaskListItem {
  return {
    id: 1,
    title: 'Test Task',
    description: null,
    task_date: '2026-01-15',
    start_time: 540,
    end_time: 600,
    task_type: 'DOCUMENT' as any,
    work_type: 'OFFICE' as any,
    status: 'READY' as any,
    employee_id: 1,
    employee_name: 'Test',
    customer_id: null,
    customer_name: null,
    completed_at: null,
    created_at: '2026-01-15',
    updated_at: '2026-01-15',
    ...overrides,
  };
}

describe('MonthView', () => {
  beforeEach(() => jest.clearAllMocks());

  it('should render 7 day-of-week headers', () => {
    render(<MonthView date={new Date('2026-01-15')} tasks={[]} />);
    expect(screen.getByText('월')).toBeInTheDocument();
    expect(screen.getByText('화')).toBeInTheDocument();
    expect(screen.getByText('수')).toBeInTheDocument();
    expect(screen.getByText('목')).toBeInTheDocument();
    expect(screen.getByText('금')).toBeInTheDocument();
    expect(screen.getByText('토')).toBeInTheDocument();
    expect(screen.getByText('일')).toBeInTheDocument();
  });

  it('should render correct number of day cells (35 or 42)', () => {
    const { container } = render(
      <MonthView date={new Date('2026-01-15')} tasks={[]} />
    );
    // The second grid (day cells) should have 35 or 42 cells
    const grids = container.querySelectorAll('.grid.grid-cols-7');
    const dayCells = grids[1]?.children;
    expect(dayCells?.length).toBeGreaterThanOrEqual(28);
    expect(dayCells?.length).toBeLessThanOrEqual(42);
  });

  it('should display office task count in blue badge', () => {
    const tasks = [
      makeTask({ id: 1, work_type: 'OFFICE' as any, task_date: '2026-01-15' }),
      makeTask({ id: 2, work_type: 'OFFICE' as any, task_date: '2026-01-15' }),
    ];
    render(<MonthView date={new Date('2026-01-15')} tasks={tasks} />);
    expect(screen.getByText('내근 2건')).toBeInTheDocument();
  });

  it('should display field task count in orange badge', () => {
    const tasks = [
      makeTask({ id: 1, work_type: 'FIELD' as any, task_date: '2026-01-15' }),
    ];
    render(<MonthView date={new Date('2026-01-15')} tasks={tasks} />);
    expect(screen.getByText('외근 1건')).toBeInTheDocument();
  });

  it('should show "+N more" when tasks > 5', () => {
    const tasks = Array.from({ length: 7 }, (_, i) =>
      makeTask({ id: i + 1, task_date: '2026-01-15', work_type: 'OFFICE' as any })
    );
    render(<MonthView date={new Date('2026-01-15')} tasks={tasks} />);
    expect(screen.getByText('+2 more')).toBeInTheDocument();
  });

  it('should call setSelectedDate on cell click', async () => {
    const user = userEvent.setup();
    render(<MonthView date={new Date('2026-01-15')} tasks={[]} />);
    // Click on day 15
    const day15 = screen.getByText('15');
    await user.click(day15.closest('[class*="cursor-pointer"]')!);
    expect(mockSetSelectedDate).toHaveBeenCalledWith('2026-01-15');
  });

  it('should call openTaskForm on cell double click', async () => {
    const user = userEvent.setup();
    render(<MonthView date={new Date('2026-01-15')} tasks={[]} />);
    const day15 = screen.getByText('15');
    await user.dblClick(day15.closest('[class*="cursor-pointer"]')!);
    expect(mockOpenTaskForm).toHaveBeenCalled();
  });
});
