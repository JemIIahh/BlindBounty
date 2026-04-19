import type { Address, Hex } from '../types.js';

export interface TxRequest {
  to: Address;
  from?: Address;
  data?: Hex;
  value?: bigint;
  gasLimit?: bigint;
  nonce?: number;
  chainId?: bigint;
}

export interface TypedDataDomain {
  name?: string;
  version?: string;
  chainId?: bigint | number;
  verifyingContract?: Address;
  salt?: Hex;
}

export type TypedDataField = { name: string; type: string };

/**
 * Uniform signing interface used across the SDK. Adapters wrap ethers Signer,
 * raw private keys, EIP-1193 providers, or KMS. Implementations MUST return
 * hex-encoded signatures (0x-prefixed) and addresses (0x-prefixed, 20 bytes).
 */
export interface Signer {
  getAddress(): Promise<Address>;
  chainId(): Promise<bigint>;
  signMessage(msg: string | Uint8Array): Promise<Hex>;
  signTypedData(
    domain: TypedDataDomain,
    types: Record<string, TypedDataField[]>,
    value: Record<string, unknown>,
  ): Promise<Hex>;
  signTransaction(tx: TxRequest): Promise<Hex>;
  /** Uncompressed secp256k1 public key, 0x04-prefixed (hex). */
  getPublicKey(): Promise<Hex>;
}
