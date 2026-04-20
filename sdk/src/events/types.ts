import type { Address, Hex, RootHash, TaskId } from '../types.js';

export interface SdkEvents {
  'task.created': { taskId: TaskId; txHash: Hex; rootHash: RootHash };
  'task.assigned': { taskId: TaskId; worker: Address; txHash: Hex };
  'task.cancelled': { taskId: TaskId; txHash: Hex };
  'evidence.submitted': { taskId: TaskId; rootHash: RootHash; txHash: Hex };
  'verification.done': { taskId: TaskId; passed: boolean; confidence: number };
  'payment.claimed': { taskId: TaskId; txHash: Hex; amount: bigint };
  'tx.sent': { hash: Hex; from: Address; to: Address };
  'tx.confirmed': { hash: Hex; blockNumber: number };
  'tx.failed': { hash: Hex; reason: string };
}
