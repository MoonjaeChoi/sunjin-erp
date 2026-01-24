// Generated: 2026-01-25 00:30:00 KST

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WeekView } from '@/components/features/dashboard/WeekView';
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
    task_date: '2026-01-13',
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
    created_at: '2026-01-13',
    updated_at: '2026-01-13',
    ...overrides,
  };
}

describe('WeekView', () => {
  beforeEach(() => jest.clearAllMocks());

  it('should render 7 day sections', () => {
    const { container } = render(
      <WeekView date={new Date('2026-01-15')} tasks={[]} />
    );
    const headings = container.querySelectorAll('h3');
    expect(headings).toHaveLength(7);
  });

  it('should display day labels in Korean format', () => {
    render(<WeekView date={new Date('2026-01-15')} tasks={[]} />);
    // Week of Jan 15 2026 starts on Monday Jan 12
    expect(screen.getByText(/1월 12일/)).toBeInTheDocument();
    expect(screen.getByText(/1월 18일/)).toBeInTheDocument();
  });

  it('should show empty message when no tasks', () => {
    render(<WeekView date={new Date('2026-01-15')} tasks={[]} />);
    const emptyMessages = screen.getAllByText('등록된 업무가 없습니다');
    expect(emptyMessages).toHaveLength(7);
  });

  it('should render TaskItem for tasks matching a day', () => {
    // Jan 13, 2026 is Monday of the week containing Jan 15
    const tasks = [
      makeTask({ id: 1, title: 'Monday Task', task_date: '2026-01-13' }),
    ];
    render(<WeekView date={new Date('2026-01-15')} tasks={tasks} />);
    expect(screen.getByText('Monday Task')).toBeInTheDocument();
  });

  it('should sort tasks by start_time', () => {
    const tasks = [
      makeTask({ id: 1, title: 'Later', task_date: '2026-01-13', start_time: 720 }),
      makeTask({ id: 2, title: 'Earlier', task_date: '2026-01-13', start_time: 480 }),
    ];
    const { container } = render(
      <WeekView date={new Date('2026-01-15')} tasks={tasks} />
    );
    const items = container.querySelectorAll('[class*="cursor-pointer"]');
    expect(items[0]).toHaveTextContent('Earlier');
    expect(items[1]).toHaveTextContent('Later');
  });

  it('should open task form on TaskItem click', async () => {
    const user = userEvent.setup();
    const tasks = [
      makeTask({ id: 42, title: 'Clickable', task_date: '2026-01-13' }),
    ];
    render(<WeekView date={new Date('2026-01-15')} tasks={tasks} />);
    await user.click(screen.getByText('Clickable'));
    expect(mockOpenTaskForm).toHaveBeenCalledWith(42);
  });
});
