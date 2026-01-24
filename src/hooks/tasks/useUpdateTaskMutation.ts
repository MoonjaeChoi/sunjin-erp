// Generated: 2026-01-25 03:30:00 KST

'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { TaskRecord, UpdateTaskDto } from '@/types/task-search';
import { taskSearchKeys } from './queryKeys';

interface UpdateTaskParams {
  id: number;
  data: UpdateTaskDto;
}

async function updateTask({ id, data }: UpdateTaskParams): Promise<TaskRecord> {
  const res = await fetch(`/api/tasks/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.error || 'Failed to update task');
  }
  return res.json();
}

export function useUpdateTaskMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateTask,
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({ queryKey: taskSearchKeys.all });
      queryClient.invalidateQueries({ queryKey: taskSearchKeys.detail(variables.id) });
      // 대시보드 캐시도 무효화
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
