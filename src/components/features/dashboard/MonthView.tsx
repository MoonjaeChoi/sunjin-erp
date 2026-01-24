// Generated: 2026-01-24 23:30:00 KST

'use client';

import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  format,
} from 'date-fns';
import { TaskListItem } from '@/types/dashboard';
import { MonthDayCell } from './MonthDayCell';

interface MonthViewProps {
  date: Date;
  tasks: TaskListItem[];
}

function groupTasksByDate(tasks: TaskListItem[]): Record<string, TaskListItem[]> {
  const grouped: Record<string, TaskListItem[]> = {};
  for (const task of tasks) {
    const dateKey = task.task_date.split('T')[0];
    if (!grouped[dateKey]) grouped[dateKey] = [];
    grouped[dateKey].push(task);
  }
  return grouped;
}

export function MonthView({ date, tasks }: MonthViewProps) {
  const monthStart = startOfMonth(date);
  const monthEnd = endOfMonth(date);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const tasksByDate = groupTasksByDate(tasks);

  return (
    <div>
      <div className="grid grid-cols-7 border-b">
        {['일', '월', '화', '수', '목', '금', '토'].map((day) => (
          <div
            key={day}
            className="py-2 text-center text-sm font-medium text-gray-500"
          >
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {days.map((day) => (
          <MonthDayCell
            key={day.toISOString()}
            date={day}
            isCurrentMonth={isSameMonth(day, date)}
            isToday={isToday(day)}
            tasks={tasksByDate[format(day, 'yyyy-MM-dd')] || []}
          />
        ))}
      </div>
    </div>
  );
}
