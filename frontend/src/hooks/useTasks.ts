import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getOpenTasks, getTask, applyToTask, getApplications } from '../services/tasks';
import type { OnChainTask, TaskMeta } from '../types/api';
import { useAuth } from '../context/AuthContext';

export function useOpenTasks(offset = 0, limit = 20) {
  return useQuery({
    queryKey: ['tasks', 'open', offset, limit],
    queryFn: () => getOpenTasks(offset, limit),
  });
}

export function useTask(id: string | undefined) {
  return useQuery({
    queryKey: ['tasks', id],
    queryFn: async (): Promise<{ onChain: OnChainTask; meta: TaskMeta }> => {
      const result = await getTask(id!);
      if ('status' in result && result.status === 'pending_confirmation') {
        throw new Error('TX_PENDING');
      }
      return result as { onChain: OnChainTask; meta: TaskMeta };
    },
    enabled: !!id,
    retry: (failureCount, error) => {
      if ((error as Error)?.message === 'TX_PENDING') return failureCount < 30;
      return failureCount < 3;
    },
    retryDelay: (failureCount) => Math.min(1000 * 2 ** failureCount, 10_000),
  });
}

export function useApplications(taskId: string | undefined) {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: ['tasks', taskId, 'applications'],
    queryFn: () => getApplications(taskId!),
    enabled: !!taskId && isAuthenticated,
  });
}

export function useApplyToTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, message }: { taskId: string; message?: string }) =>
      applyToTask(taskId, message),
    onSuccess: (_data, { taskId }) => {
      qc.invalidateQueries({ queryKey: ['tasks', taskId, 'applications'] });
    },
  });
}
