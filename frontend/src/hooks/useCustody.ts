import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCustodyChain, verifyIntegrity, getAuditLog, ingestEvidence } from '../services/custody';
import { useAuth } from '../context/AuthContext';

export function useCustodyChain(taskId: string | null) {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: ['custody-chain', taskId],
    queryFn: () => getCustodyChain(taskId!),
    enabled: !!taskId && isAuthenticated,
  });
}

export function useVerifyIntegrity(taskId: string | null) {
  return useQuery({
    queryKey: ['custody-verify', taskId],
    queryFn: () => verifyIntegrity(taskId!),
    enabled: false, // manual trigger only
  });
}

export function useAuditLog(taskId: string | null) {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: ['custody-audit', taskId],
    queryFn: () => getAuditLog(taskId!),
    enabled: !!taskId && isAuthenticated,
  });
}

export function useIngestEvidence() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (params: { taskId: string; evidenceHash: string; dataSnapshot?: string }) =>
      ingestEvidence(params.taskId, params.evidenceHash, params.dataSnapshot),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['custody-chain', variables.taskId] });
    },
  });
}
