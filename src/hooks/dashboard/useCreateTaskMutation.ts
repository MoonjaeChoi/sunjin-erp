// Generated: 2026-01-24 23:30:00 KST

'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { CreateTaskDto, TaskListResponse } from '@/types/dashboard';
import { TaskStatus } from '@/types/task';
import { taskKeys } from './queryKeys';

async function createTask(dto: CreateTaskDto) {
  const res = await fetch('/api/tasks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dto),
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw { status: res.status, ...error };
  }
  return res.json();
}

export function useCreateTaskMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createTask,
    onMutate: async (newTask) => {
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
            tasks: [
              ...old.tasks,
              {
                ...newTask,
                id: Date.now(),
                description: newTask.description || null,
                start_time: newTask.start_time ?? null,
                end_time: newTask.end_time ?? null,
                status: newTask.status || TaskStatus.READY,
                employee_id: 0,
                employee_name: '',
                customer_id: newTask.customer_id ?? null,
                customer_name: null,
                completed_at: null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              },
            ],
            total: old.total + 1,
          };
        }
      );

      return { previousTasks };
    },
    onError: (_err, _newTask, context) => {
      if (context?.previousTasks) {
        for (const [queryKey, data] of context.previousTasks) {
          queryClient.setQueryData(queryKey, data);
        }
      }
      console.error('업무 등록에 실패했습니다.');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.all });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
