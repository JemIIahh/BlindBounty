import { useMutation } from '@tanstack/react-query';
import { signAndSendTx } from '../lib/txSigner';
import { useWallet } from '../context/WalletContext';
import type { UnsignedTx } from '../types/api';

export function useTxSend() {
  const { signer } = useWallet();

  return useMutation({
    mutationFn: async (unsignedTx: UnsignedTx) => {
      if (!signer) throw new Error('Wallet not connected');
      return signAndSendTx(signer, unsignedTx);
    },
  });
}
