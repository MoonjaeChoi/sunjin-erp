// Generated: 2026-01-24 23:30:00 KST

'use client';

import { format } from 'date-fns';
import { TaskListItem } from '@/types/dashboard';
import { TaskItem } from './TaskItem';

interface DayViewProps {
  date: Date;
  tasks: TaskListItem[];
}

export function DayView({ date, tasks }: DayViewProps) {
  const dateStr = format(date, 'yyyy-MM-dd');
  const dayTasks = tasks
    .filter((t) => t.task_date.split('T')[0] === dateStr)
    .sort((a, b) => (a.start_time ?? 1440) - (b.start_time ?? 1440));

  return (
    <div className="space-y-2">
      {dayTasks.length > 0 ? (
        dayTasks.map((task) => <TaskItem key={task.id} task={task} />)
      ) : (
        <p className="text-sm text-gray-400">등록된 업무가 없습니다</p>
      )}
    </div>
  );
}
