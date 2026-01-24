// Generated: 2026-01-25 00:30:00 KST

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DayView } from '@/components/features/dashboard/DayView';
import { TaskListItem } from '@/types/dashboard';

const mockOpenTaskForm = jest.fn();
jest.mock('@/stores/useCalendarStore', () => ({
  useCalendarStore: () => ({
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

describe('DayView', () => {
  beforeEach(() => jest.clearAllMocks());

  it('should show empty message when no tasks for the date', () => {
    render(<DayView date={new Date('2026-01-15')} tasks={[]} />);
    expect(screen.getByText('등록된 업무가 없습니다')).toBeInTheDocument();
  });

  it('should render tasks matching the date', () => {
    const tasks = [
      makeTask({ id: 1, title: 'Task A', task_date: '2026-01-15' }),
      makeTask({ id: 2, title: 'Other Day', task_date: '2026-01-16' }),
    ];
    render(<DayView date={new Date('2026-01-15')} tasks={tasks} />);
    expect(screen.getByText('Task A')).toBeInTheDocument();
    expect(screen.queryByText('Other Day')).not.toBeInTheDocument();
  });

  it('should sort tasks by start_time', () => {
    const tasks = [
      makeTask({ id: 1, title: 'Late', task_date: '2026-01-15', start_time: 720 }),
      makeTask({ id: 2, title: 'Early', task_date: '2026-01-15', start_time: 480 }),
    ];
    const { container } = render(
      <DayView date={new Date('2026-01-15')} tasks={tasks} />
    );
    const items = container.querySelectorAll('[class*="cursor-pointer"]');
    expect(items[0]).toHaveTextContent('Early');
    expect(items[1]).toHaveTextContent('Late');
  });

  it('should display time strings for tasks with start_time', () => {
    const tasks = [
      makeTask({ id: 1, title: 'Timed', task_date: '2026-01-15', start_time: 540, end_time: 600 }),
    ];
    render(<DayView date={new Date('2026-01-15')} tasks={tasks} />);
    expect(screen.getByText(/09:00/)).toBeInTheDocument();
    expect(screen.getByText(/10:00/)).toBeInTheDocument();
  });

  it('should show "시간 미정" for tasks without start_time', () => {
    const tasks = [
      makeTask({ id: 1, title: 'No Time', task_date: '2026-01-15', start_time: null, end_time: null }),
    ];
    render(<DayView date={new Date('2026-01-15')} tasks={tasks} />);
    expect(screen.getByText('시간 미정')).toBeInTheDocument();
  });

  it('should open task form on TaskItem click', async () => {
    const user = userEvent.setup();
    const tasks = [
      makeTask({ id: 7, title: 'Click Me', task_date: '2026-01-15' }),
    ];
    render(<DayView date={new Date('2026-01-15')} tasks={tasks} />);
    await user.click(screen.getByText('Click Me'));
    expect(mockOpenTaskForm).toHaveBeenCalledWith(7);
  });
});
