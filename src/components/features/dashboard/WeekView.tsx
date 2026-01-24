// Generated: 2026-01-24 23:30:00 KST

'use client';

import { startOfWeek, addDays, eachDayOfInterval, format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { TaskListItem } from '@/types/dashboard';
import { TaskItem } from './TaskItem';

interface WeekViewProps {
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

export function WeekView({ date, tasks }: WeekViewProps) {
  const weekStart = startOfWeek(date, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({
    start: weekStart,
    end: addDays(weekStart, 6),
  });

  const tasksByDate = groupTasksByDate(tasks);

  return (
    <div className="space-y-4">
      {weekDays.map((day) => {
        const dateStr = format(day, 'yyyy-MM-dd');
        const dayTasks = (tasksByDate[dateStr] || []).sort(
          (a, b) => (a.start_time ?? 1440) - (b.start_time ?? 1440)
        );
        return (
          <div key={dateStr}>
            <h3 className="font-medium text-sm text-gray-700 mb-2">
              {format(day, 'M월 d일 (EEE)', { locale: ko })}
            </h3>
            {dayTasks.length > 0 ? (
              <div className="space-y-1">
                {dayTasks.map((task) => (
                  <TaskItem key={task.id} task={task} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400">등록된 업무가 없습니다</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
