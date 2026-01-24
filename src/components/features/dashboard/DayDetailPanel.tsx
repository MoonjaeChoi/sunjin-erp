// Generated: 2026-01-24 23:30:00 KST

'use client';

import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCalendarStore } from '@/stores/useCalendarStore';
import { useDailySummaryQuery, useUpdateTaskMutation } from '@/hooks/dashboard';
import { TaskStatus, TaskStatusLabel, WorkType, WorkTypeLabel } from '@/types/task';
import { TaskSummaryItem } from '@/types/dashboard';
import { minutesToTimeString } from '@/lib/utils/time';

interface DayDetailPanelProps {
  date: string;
}

const statusColors: Record<TaskStatus, string> = {
  READY: 'bg-gray-100 text-gray-700 border-gray-200',
  IN_PROGRESS: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  DONE: 'bg-green-100 text-green-700 border-green-200',
};

const workTypeColors: Record<WorkType, string> = {
  OFFICE: 'bg-blue-100 text-blue-700 border-blue-200',
  FIELD: 'bg-orange-100 text-orange-700 border-orange-200',
};

export function DayDetailPanel({ date }: DayDetailPanelProps) {
  const { setSelectedDate } = useCalendarStore();
  const { data, isLoading } = useDailySummaryQuery(date);
  const updateMutation = useUpdateTaskMutation();

  const handleStatusChange = (taskId: number, newStatus: TaskStatus) => {
    updateMutation.mutate({ id: taskId, dto: { status: newStatus } });
  };

  const getNextStatus = (current: TaskStatus): TaskStatus => {
    if (current === TaskStatus.READY) return TaskStatus.IN_PROGRESS;
    if (current === TaskStatus.IN_PROGRESS) return TaskStatus.DONE;
    return TaskStatus.READY;
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base">
          {format(new Date(date), 'yyyy년 M월 d일 (EEE)', { locale: ko })}
        </CardTitle>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSelectedDate(null)}
        >
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">업무</h4>
          {isLoading ? (
            <p className="text-sm text-gray-400">로딩 중...</p>
          ) : data?.tasks.length ? (
            <div className="space-y-2">
              {data.tasks.map((task: TaskSummaryItem) => (
                <div
                  key={task.id}
                  className="flex items-center gap-2 p-2 rounded border text-sm"
                >
                  <Badge
                    variant="outline"
                    className={workTypeColors[task.work_type as WorkType]}
                  >
                    {WorkTypeLabel[task.work_type as WorkType]}
                  </Badge>
                  <span className="text-gray-500 text-xs">
                    {task.start_time !== null
                      ? minutesToTimeString(task.start_time)
                      : ''}
                  </span>
                  <span className="flex-1 truncate">{task.title}</span>
                  <button
                    className="shrink-0"
                    disabled={updateMutation.isPending}
                    onClick={() =>
                      handleStatusChange(
                        task.id,
                        getNextStatus(task.status as TaskStatus)
                      )
                    }
                  >
                    <Badge
                      variant="outline"
                      className={`cursor-pointer ${statusColors[task.status as TaskStatus]}`}
                    >
                      {TaskStatusLabel[task.status as TaskStatus]}
                    </Badge>
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400">등록된 업무가 없습니다</p>
          )}
        </div>

        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">기술지원</h4>
          {data?.techSupports.length ? (
            <div className="space-y-2">
              {data.techSupports.map((ts) => (
                <div
                  key={ts.id}
                  className="text-sm p-2 rounded border bg-gray-50"
                >
                  {ts.customer_name} - {ts.title}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400">기술지원 내역 없음</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
