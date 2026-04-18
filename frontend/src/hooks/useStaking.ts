import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getWorkerStakes, lockStake, releaseStake, slashStake } from '../services/staking';

export function useWorkerStakes(address: string | null) {
  return useQuery({
    queryKey: ['staking', address],
    queryFn: () => getWorkerStakes(address!),
    enabled: !!address,
  });
}

export function useLockStake() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: { taskId: string; taskReward: number }) =>
      lockStake(params.taskId, params.taskReward),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staking'] });
    },
  });
}

export function useReleaseStake() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (taskId: string) => releaseStake(taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staking'] });
    },
  });
}

export function useSlashStake() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (taskId: string) => slashStake(taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staking'] });
    },
  });
}
