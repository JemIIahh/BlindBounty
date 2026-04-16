import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSubmission, buildSubmitEvidence } from '../services/submissions';
import { signAndSendTx } from '../lib/txSigner';
import { useWallet } from '../context/WalletContext';

export function useSubmission(taskId: string | undefined) {
  return useQuery({
    queryKey: ['submissions', taskId],
    queryFn: () => getSubmission(taskId!),
    enabled: !!taskId,
  });
}

export function useSubmitEvidence() {
  const { signer } = useWallet();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ taskId, evidenceHash }: { taskId: string; evidenceHash: string }) => {
      if (!signer) throw new Error('Wallet not connected');
      const unsignedTx = await buildSubmitEvidence({ taskId, evidenceHash });
      return signAndSendTx(signer, unsignedTx);
    },
    onSuccess: (_data, { taskId }) => {
      qc.invalidateQueries({ queryKey: ['tasks', taskId] });
      qc.invalidateQueries({ queryKey: ['submissions', taskId] });
    },
  });
}
