import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { triggerVerification, getVerificationStatus } from '../services/verification';
import type { VerificationInput } from '../services/verification';

export function useVerificationStatus() {
  return useQuery({
    queryKey: ['verification', 'status'],
    queryFn: () => getVerificationStatus(),
  });
}

export function useTriggerVerification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: VerificationInput) => triggerVerification(params),
    onSuccess: (_data, params) => {
      qc.invalidateQueries({ queryKey: ['verification'] });
      qc.invalidateQueries({ queryKey: ['tasks', String(params.taskId)] });
    },
  });
}
