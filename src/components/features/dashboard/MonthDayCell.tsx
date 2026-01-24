// Generated: 2026-01-24 23:30:00 KST

'use client';

import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useCalendarStore } from '@/stores/useCalendarStore';
import { TaskListItem } from '@/types/dashboard';

interface MonthDayCellProps {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  tasks: TaskListItem[];
}

export function MonthDayCell({
  date,
  isCurrentMonth,
  isToday: todayFlag,
  tasks,
}: MonthDayCellProps) {
  const { setSelectedDate, openTaskForm } = useCalendarStore();
  const dateStr = format(date, 'yyyy-MM-dd');

  const officeTasks = tasks.filter((t) => t.work_type === 'OFFICE');
  const fieldTasks = tasks.filter((t) => t.work_type === 'FIELD');

  return (
    <div
      className={cn(
        'group min-h-[100px] p-1 border-b border-r cursor-pointer hover:bg-gray-50',
        !isCurrentMonth && 'bg-gray-50 text-gray-400'
      )}
      onClick={() => setSelectedDate(dateStr)}
      onDoubleClick={() => openTaskForm()}
    >
      <div className="flex items-center justify-between">
        <span
          className={cn(
            'text-sm w-6 h-6 flex items-center justify-center rounded-full',
            todayFlag && 'bg-blue-600 text-white font-bold'
          )}
        >
          {format(date, 'd')}
        </span>
        {isCurrentMonth && tasks.length === 0 && (
          <button
            className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-gray-600 text-sm"
            onClick={(e) => {
              e.stopPropagation();
              openTaskForm();
            }}
          >
            +
          </button>
        )}
      </div>

      <div className="mt-1 space-y-0.5">
        {officeTasks.length > 0 && (
          <div className="text-xs px-1 py-0.5 rounded bg-blue-100 text-blue-700 truncate">
            내근 {officeTasks.length}건
          </div>
        )}
        {fieldTasks.length > 0 && (
          <div className="text-xs px-1 py-0.5 rounded bg-orange-100 text-orange-700 truncate">
            외근 {fieldTasks.length}건
          </div>
        )}
        {tasks.length > 5 && (
          <div className="text-xs text-gray-500">
            +{tasks.length - 5} more
          </div>
        )}
      </div>
    </div>
  );
}
