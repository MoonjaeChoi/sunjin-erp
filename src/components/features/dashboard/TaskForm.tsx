// Generated: 2026-01-24 23:30:00 KST

'use client';

import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCalendarStore } from '@/stores/useCalendarStore';
import {
  useCreateTaskMutation,
  useUpdateTaskMutation,
  useDeleteTaskMutation,
  useTasksQuery,
} from '@/hooks/dashboard';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import {
  TaskType,
  TaskTypeLabel,
  WorkType,
  WorkTypeLabel,
  TaskStatus,
  TaskStatusLabel,
} from '@/types/task';
import { CreateTaskDto, TaskListItem } from '@/types/dashboard';
import { timeStringToMinutes, minutesToTimeString, isTimeOverlap } from '@/lib/utils/time';

async function fetchTask(id: number): Promise<TaskListItem> {
  const res = await fetch(`/sunjin/api/tasks/${id}`);
  if (!res.ok) throw new Error('Failed to fetch task');
  return res.json();
}

export function TaskForm() {
  const { taskFormOpen, editingTaskId, closeTaskForm } = useCalendarStore();
  const createMutation = useCreateTaskMutation();
  const updateMutation = useUpdateTaskMutation();
  const deleteMutation = useDeleteTaskMutation();
  const isDesktop = useMediaQuery('(min-width: 768px)');

  const { data: existingTask } = useQuery({
    queryKey: ['tasks', 'detail', editingTaskId],
    queryFn: () => fetchTask(editingTaskId!),
    enabled: editingTaskId !== null,
  });

  const [formData, setFormData] = useState<CreateTaskDto>({
    title: '',
    task_date: new Date().toISOString().split('T')[0],
    task_type: TaskType.DOCUMENT,
    work_type: WorkType.OFFICE,
  });
  const [startTimeStr, setStartTimeStr] = useState('');
  const [endTimeStr, setEndTimeStr] = useState('');
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const [timeOverlapWarning, setTimeOverlapWarning] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // 기존 업무 로드 시 폼 채우기
  useEffect(() => {
    if (existingTask && editingTaskId) {
      setFormData({
        title: existingTask.title,
        task_date: existingTask.task_date.split('T')[0],
        task_type: existingTask.task_type as TaskType,
        work_type: existingTask.work_type as WorkType,
        status: existingTask.status as TaskStatus,
        customer_id: existingTask.customer_id ?? undefined,
      });
      setStartTimeStr(
        existingTask.start_time !== null
          ? minutesToTimeString(existingTask.start_time)
          : ''
      );
      setEndTimeStr(
        existingTask.end_time !== null
          ? minutesToTimeString(existingTask.end_time)
          : ''
      );
      setDescription(existingTask.description || '');
    }
  }, [existingTask, editingTaskId]);

  // 폼 열릴 때 초기화 (신규 모드)
  useEffect(() => {
    if (taskFormOpen && !editingTaskId) {
      setFormData({
        title: '',
        task_date: new Date().toISOString().split('T')[0],
        task_type: TaskType.DOCUMENT,
        work_type: WorkType.OFFICE,
      });
      setStartTimeStr('');
      setEndTimeStr('');
      setDescription('');
      setErrors([]);
      setTimeOverlapWarning(null);
    }
  }, [taskFormOpen, editingTaskId]);

  // 시간 겹침 확인
  const { data: tasksData } = useTasksQuery({
    date_from: formData.task_date,
    date_to: formData.task_date,
  });

  useEffect(() => {
    if (startTimeStr && endTimeStr && tasksData?.tasks) {
      try {
        const start = timeStringToMinutes(startTimeStr);
        const end = timeStringToMinutes(endTimeStr);
        const overlapping = tasksData.tasks.filter(
          (t) =>
            t.id !== editingTaskId &&
            t.start_time !== null &&
            t.end_time !== null &&
            isTimeOverlap(start, end, t.start_time, t.end_time)
        );
        setTimeOverlapWarning(
          overlapping.length > 0
            ? `${overlapping.length}건의 업무와 시간이 겹칩니다`
            : null
        );
      } catch {
        setTimeOverlapWarning(null);
      }
    } else {
      setTimeOverlapWarning(null);
    }
  }, [startTimeStr, endTimeStr, tasksData, editingTaskId]);

  const validate = (): string[] => {
    const errs: string[] = [];
    if (!formData.title.trim()) errs.push('제목을 입력해주세요');
    if (formData.title.length > 200) errs.push('제목은 200자 이내로 입력해주세요');
    if (!formData.task_date) errs.push('날짜를 선택해주세요');
    if (startTimeStr && !/^\d{2}:\d{2}$/.test(startTimeStr)) errs.push('시작 시간 형식이 올바르지 않습니다 (HH:MM)');
    if (endTimeStr && !/^\d{2}:\d{2}$/.test(endTimeStr)) errs.push('종료 시간 형식이 올바르지 않습니다 (HH:MM)');
    if (startTimeStr && endTimeStr) {
      try {
        const s = timeStringToMinutes(startTimeStr);
        const e = timeStringToMinutes(endTimeStr);
        if (s >= e) errs.push('시작 시간은 종료 시간보다 빨라야 합니다');
      } catch {
        errs.push('시간 값이 올바르지 않습니다');
      }
    }
    return errs;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validate();
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }
    setErrors([]);

    const dto: CreateTaskDto = {
      ...formData,
      description: description || undefined,
      start_time: startTimeStr ? timeStringToMinutes(startTimeStr) : undefined,
      end_time: endTimeStr ? timeStringToMinutes(endTimeStr) : undefined,
    };

    if (editingTaskId) {
      updateMutation.mutate(
        { id: editingTaskId, dto },
        { onSuccess: () => closeTaskForm() }
      );
    } else {
      createMutation.mutate(dto, { onSuccess: () => closeTaskForm() });
    }
  };

  const handleDelete = () => {
    if (!editingTaskId) return;
    deleteMutation.mutate(editingTaskId, {
      onSuccess: () => {
        setShowDeleteConfirm(false);
        closeTaskForm();
      },
    });
  };

  const isPending =
    createMutation.isPending ||
    updateMutation.isPending ||
    deleteMutation.isPending;

  if (!taskFormOpen) return null;

  const formContent = (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-lg font-semibold">
        {editingTaskId ? '업무 수정' : '업무 등록'}
      </h2>

      {errors.length > 0 && (
        <div className="text-sm text-red-600 space-y-1">
          {errors.map((err, i) => (
            <p key={i}>{err}</p>
          ))}
        </div>
      )}

      <div className="space-y-3">
        <div>
          <label className="text-sm font-medium">제목 *</label>
          <input
            type="text"
            className="w-full mt-1 px-3 py-2 border rounded-md text-sm"
            maxLength={200}
            value={formData.title}
            onChange={(e) =>
              setFormData({ ...formData, title: e.target.value })
            }
          />
        </div>

        <div>
          <label className="text-sm font-medium">날짜 *</label>
          <input
            type="date"
            className="w-full mt-1 px-3 py-2 border rounded-md text-sm"
            value={formData.task_date}
            onChange={(e) =>
              setFormData({ ...formData, task_date: e.target.value })
            }
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-sm font-medium">시작 시간</label>
            <input
              type="time"
              className="w-full mt-1 px-3 py-2 border rounded-md text-sm"
              value={startTimeStr}
              onChange={(e) => setStartTimeStr(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-medium">종료 시간</label>
            <input
              type="time"
              className="w-full mt-1 px-3 py-2 border rounded-md text-sm"
              value={endTimeStr}
              onChange={(e) => setEndTimeStr(e.target.value)}
            />
          </div>
        </div>

        {timeOverlapWarning && (
          <p className="text-sm text-amber-600">{timeOverlapWarning}</p>
        )}

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-sm font-medium">업무 유형 *</label>
            <Select
              value={formData.task_type}
              onValueChange={(v) =>
                setFormData({ ...formData, task_type: v as TaskType })
              }
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.values(TaskType).map((type) => (
                  <SelectItem key={type} value={type}>
                    {TaskTypeLabel[type]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium">근무 형태 *</label>
            <Select
              value={formData.work_type}
              onValueChange={(v) =>
                setFormData({ ...formData, work_type: v as WorkType })
              }
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.values(WorkType).map((type) => (
                  <SelectItem key={type} value={type}>
                    {WorkTypeLabel[type]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {editingTaskId && (
          <div>
            <label className="text-sm font-medium">상태</label>
            <Select
              value={formData.status || TaskStatus.READY}
              onValueChange={(v) =>
                setFormData({ ...formData, status: v as TaskStatus })
              }
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.values(TaskStatus).map((status) => (
                  <SelectItem key={status} value={status}>
                    {TaskStatusLabel[status]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div>
          <label className="text-sm font-medium">설명</label>
          <textarea
            className="w-full mt-1 px-3 py-2 border rounded-md text-sm min-h-[80px]"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
      </div>

      <div className="flex justify-between pt-2">
        <div>
          {editingTaskId && (
            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={isPending}
              onClick={() => setShowDeleteConfirm(true)}
            >
              삭제
            </Button>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={closeTaskForm}
          >
            취소
          </Button>
          <Button type="submit" size="sm" disabled={isPending}>
            {isPending ? '저장 중...' : editingTaskId ? '수정' : '등록'}
          </Button>
        </div>
      </div>

      {showDeleteConfirm && (
        <div className="p-3 border rounded-md bg-red-50 space-y-2">
          <p className="text-sm text-red-700">
            {existingTask?.status === TaskStatus.DONE
              ? '완료된 업무입니다. 정말 삭제하시겠습니까?'
              : '이 업무를 삭제하시겠습니까?'}
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={isPending}
              onClick={handleDelete}
            >
              확인
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowDeleteConfirm(false)}
            >
              취소
            </Button>
          </div>
        </div>
      )}
    </form>
  );

  // Dialog (desktop) vs Sheet-like overlay (mobile)
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={closeTaskForm}
      />
      <div
        className={`relative bg-white rounded-lg shadow-lg p-6 max-h-[90vh] overflow-y-auto ${
          isDesktop ? 'w-[480px]' : 'w-full mx-4'
        }`}
      >
        {formContent}
      </div>
    </div>
  );
}
