// Generated: 2026-01-24 23:30:00 KST

'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { UpdateTaskDto, TaskListResponse } from '@/types/dashboard';
import { taskKeys } from './queryKeys';

interface UpdateTaskParams {
  id: number;
  dto: UpdateTaskDto;
}

async function updateTask({ id, dto }: UpdateTaskParams) {
  const res = await fetch(`/api/tasks/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dto),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw { status: res.status, ...error };
  }
  return res.json();
}

export function useUpdateTaskMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateTask,
    onMutate: async ({ id, dto }) => {
      await queryClient.cancelQueries({ queryKey: taskKeys.all });
      const previousTasks = queryClient.getQueriesData<TaskListResponse>({
        queryKey: taskKeys.lists(),
      });

      queryClient.setQueriesData<TaskListResponse>(
        { queryKey: taskKeys.lists() },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            tasks: old.tasks.map((task) =>
              task.id === id ? { ...task, ...dto, updated_at: new Date().toISOString() } : task
            ),
          };
        }
      );

      return { previousTasks };
    },
    onError: (_err, _params, context) => {
      if (context?.previousTasks) {
        for (const [queryKey, data] of context.previousTasks) {
          queryClient.setQueryData(queryKey, data);
        }
      }
      console.error('업무 수정에 실패했습니다.');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
