// Generated: 2026-01-25 04:10:00 KST

'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  TaskType,
  TaskTypeLabel,
  WorkType,
  WorkTypeLabel,
  TaskStatus,
  TaskStatusLabel,
} from '@/types/task';
import { UpdateTaskDto } from '@/types/task-search';
import { useTaskDetailQuery, useUpdateTaskMutation } from '@/hooks/tasks';

interface TaskDetailDialogProps {
  taskId: number | null;
  onClose: () => void;
}

function timeToHourMinute(minutes: number | null): { hour: string; minute: string } {
  if (minutes === null) return { hour: '', minute: '' };
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return { hour: String(h), minute: String(m) };
}

function hourMinuteToTime(hour: string, minute: string): number | null {
  if (hour === '' && minute === '') return null;
  const h = hour === '' ? 0 : Number(hour);
  const m = minute === '' ? 0 : Number(minute);
  return h * 60 + m;
}

export function TaskDetailDialog({ taskId, onClose }: TaskDetailDialogProps) {
  const { data: session } = useSession();
  const { data: task, isLoading } = useTaskDetailQuery(taskId);
  const updateMutation = useUpdateTaskMutation();

  // 폼 상태
  const [title, setTitle] = useState('');
  const [taskDate, setTaskDate] = useState('');
  const [taskType, setTaskType] = useState<TaskType>(TaskType.OTHER);
  const [workType, setWorkType] = useState<WorkType>(WorkType.OFFICE);
  const [status, setStatus] = useState<TaskStatus>(TaskStatus.READY);
  const [startHour, setStartHour] = useState('');
  const [startMinute, setStartMinute] = useState('');
  const [endHour, setEndHour] = useState('');
  const [endMinute, setEndMinute] = useState('');
  const [description, setDescription] = useState('');

  // task 로드 시 폼 초기화
  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setTaskDate(task.task_date.split('T')[0]);
      setTaskType(task.task_type);
      setWorkType(task.work_type);
      setStatus(task.status);
      const start = timeToHourMinute(task.start_time);
      setStartHour(start.hour);
      setStartMinute(start.minute);
      const end = timeToHourMinute(task.end_time);
      setEndHour(end.hour);
      setEndMinute(end.minute);
      setDescription(task.description || '');
    }
  }, [task]);

  // 수정 권한
  const canEdit = task && session?.user && (session.user as any).id === task.employee_id;

  // 시간 검증
  const startTime = hourMinuteToTime(startHour, startMinute);
  const endTime = hourMinuteToTime(endHour, endMinute);
  const timeError = startTime !== null && endTime !== null && startTime >= endTime
    ? '시작 시간이 종료 시간보다 같거나 늦습니다.'
    : null;

  const handleSave = async () => {
    if (!taskId || !canEdit) return;
    if (timeError) {
      toast.error(timeError);
      return;
    }

    const data: UpdateTaskDto = {
      title: title.trim(),
      description: description.trim() || null,
      task_date: taskDate,
      task_type: taskType,
      work_type: workType,
      status,
      start_time: startTime,
      end_time: endTime,
    };

    try {
      await updateMutation.mutateAsync({ id: taskId, data });
      toast.success('업무가 수정되었습니다.');
    } catch {
      toast.error('수정에 실패했습니다.');
    }
  };

  const hourOptions = Array.from({ length: 24 }, (_, i) => i);
  const minuteOptions = Array.from({ length: 12 }, (_, i) => i * 5);

  return (
    <Dialog open={taskId !== null} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>업무 상세</DialogTitle>
          <DialogDescription>
            {canEdit ? '업무 정보를 수정할 수 있습니다.' : '업무 상세 정보입니다.'}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-4 py-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-9 w-full" />
              </div>
            ))}
          </div>
        ) : task ? (
          <div className="space-y-4 py-2">
            {/* 제목 */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">제목</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={!canEdit}
                maxLength={200}
              />
            </div>

            {/* 날짜 */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">날짜</label>
              <Input
                type="date"
                value={taskDate}
                onChange={(e) => setTaskDate(e.target.value)}
                disabled={!canEdit}
              />
            </div>

            {/* 업무 유형 + 근무 형태 */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">업무 유형</label>
                <Select value={taskType} onValueChange={(v) => setTaskType(v as TaskType)} disabled={!canEdit}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(TaskTypeLabel).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">근무 형태</label>
                <Select value={workType} onValueChange={(v) => setWorkType(v as WorkType)} disabled={!canEdit}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(WorkTypeLabel).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* 상태 */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">상태</label>
              <Select value={status} onValueChange={(v) => setStatus(v as TaskStatus)} disabled={!canEdit}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(TaskStatusLabel).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 시작 시간 */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">시작 시간</label>
                <div className="flex gap-1.5">
                  <Select value={startHour} onValueChange={setStartHour} disabled={!canEdit}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="시" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">-</SelectItem>
                      {hourOptions.map((h) => (
                        <SelectItem key={h} value={String(h)}>
                          {String(h).padStart(2, '0')}시
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={startMinute} onValueChange={setStartMinute} disabled={!canEdit}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="분" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">-</SelectItem>
                      {minuteOptions.map((m) => (
                        <SelectItem key={m} value={String(m)}>
                          {String(m).padStart(2, '0')}분
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">종료 시간</label>
                <div className="flex gap-1.5">
                  <Select value={endHour} onValueChange={setEndHour} disabled={!canEdit}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="시" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">-</SelectItem>
                      {hourOptions.map((h) => (
                        <SelectItem key={h} value={String(h)}>
                          {String(h).padStart(2, '0')}시
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={endMinute} onValueChange={setEndMinute} disabled={!canEdit}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="분" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">-</SelectItem>
                      {minuteOptions.map((m) => (
                        <SelectItem key={m} value={String(m)}>
                          {String(m).padStart(2, '0')}분
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            {timeError && (
              <p className="text-sm text-destructive">{timeError}</p>
            )}

            {/* 설명 */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">설명</label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={!canEdit}
                rows={4}
                placeholder="업무 설명을 입력하세요..."
              />
            </div>
          </div>
        ) : null}

        {canEdit && (
          <DialogFooter>
            <Button variant="outline" onClick={onClose}>
              취소
            </Button>
            <Button
              onClick={handleSave}
              disabled={updateMutation.isPending || !title.trim() || !!timeError}
            >
              {updateMutation.isPending ? '저장 중...' : '저장'}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
