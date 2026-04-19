import { ethers } from 'ethers';
import { EthersSigner } from './EthersSigner.js';

/**
 * Convenience factory for Node / headless agents: builds an EthersSigner
 * backed by a fresh ethers.Wallet from a raw private key (hex, with or
 * without 0x prefix). Optionally attaches an RPC provider so chainId()
 * and on-chain reads work.
 *
 * NEVER pass a private key you don't control — prefer KMS, browser wallet,
 * or hardware signer for production.
 */
export class PrivateKeySigner extends EthersSigner {
  constructor(privateKey: string, provider?: ethers.Provider) {
    const pk = privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`;
    const wallet = provider ? new ethers.Wallet(pk, provider) : new ethers.Wallet(pk);
    super(wallet);
  }
}
