export type Address = `0x${string}`;
export type Hex = `0x${string}`;
export type TaskId = bigint;
export type RootHash = Hex;

export type TokenSymbol = 'USDC' | 'A0GI' | string;

export interface TokenRef {
  address: Address;
  symbol?: TokenSymbol;
  decimals?: number;
}

export interface Reward {
  token: Address | TokenSymbol;
  amount: bigint;
}

export type TaskStatus =
  | 'funded'
  | 'assigned'
  | 'submitted'
  | 'verified'
  | 'completed'
  | 'cancelled';

export interface TaskMetadata {
  category: string;
  locationZone: string;
  reward: Reward;
  deadline?: Date;
  extra?: Record<string, string>;
}

export interface TaskRecord extends TaskMetadata {
  taskId: TaskId;
  agent: Address;
  worker?: Address;
  taskHash: RootHash;
  evidenceHash?: RootHash;
  status: TaskStatus;
  createdAt: Date;
}

export interface TaskKey {
  /** AES-256 symmetric key (32 bytes) used to encrypt task content. */
  aesKey: Uint8Array;
  createdAt: Date;
}

export interface TaskKeyRef {
  taskId: TaskId;
  createdAt: Date;
}

export interface UploadResult {
  rootHash: RootHash;
  txHash?: Hex;
  size: number;
}

export interface VerificationResult {
  passed: boolean;
  confidence: number;
  model: string;
  attestation?: Hex;
  completedAt: Date;
}

export interface TxReceiptLike {
  hash: Hex;
  blockNumber: number;
  gasUsed: bigint;
}

export type Awaitable<T> = T | Promise<T>;
