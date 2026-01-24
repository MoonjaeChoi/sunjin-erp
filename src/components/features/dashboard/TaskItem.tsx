// Generated: 2026-01-24 23:30:00 KST

'use client';

import { Badge } from '@/components/ui/badge';
import { useCalendarStore } from '@/stores/useCalendarStore';
import { TaskListItem } from '@/types/dashboard';
import { TaskStatus, TaskStatusLabel, WorkType, WorkTypeLabel } from '@/types/task';
import { minutesToTimeString } from '@/lib/utils/time';

interface TaskItemProps {
  task: TaskListItem;
}

const workTypeColors: Record<WorkType, string> = {
  OFFICE: 'bg-blue-100 text-blue-700 border-blue-200',
  FIELD: 'bg-orange-100 text-orange-700 border-orange-200',
};

const statusColors: Record<TaskStatus, string> = {
  READY: 'bg-gray-100 text-gray-700 border-gray-200',
  IN_PROGRESS: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  DONE: 'bg-green-100 text-green-700 border-green-200',
};

export function TaskItem({ task }: TaskItemProps) {
  const { openTaskForm } = useCalendarStore();

  return (
    <div
      className="flex items-center gap-3 p-3 rounded-lg border hover:bg-gray-50 cursor-pointer"
      onClick={() => openTaskForm(task.id)}
    >
      <div className="text-sm text-gray-500 w-24 shrink-0">
        {task.start_time !== null
          ? `${minutesToTimeString(task.start_time)}${task.end_time !== null ? ` - ${minutesToTimeString(task.end_time)}` : ''}`
          : '시간 미정'}
      </div>

      <div className="flex-1 text-sm font-medium truncate">{task.title}</div>

      <Badge variant="outline" className={workTypeColors[task.work_type as WorkType]}>
        {WorkTypeLabel[task.work_type as WorkType]}
      </Badge>
      <Badge variant="outline" className={statusColors[task.status as TaskStatus]}>
        {TaskStatusLabel[task.status as TaskStatus]}
      </Badge>
    </div>
  );
}
