import type { BlindEscrowClient } from '../chain/index.js';
import {
  aesEncrypt,
  eciesEncrypt,
  generateAesKey,
  openEvidenceAsAgent,
} from '../crypto/index.js';
import { LifecycleError } from '../errors/index.js';
import type { EventBus, SdkEvents } from '../events/index.js';
import type { KeyStore } from '../keystore/index.js';
import type { Signer } from '../signer/index.js';
import type { Storage } from '../storage/index.js';
import type { Address, Hex, Reward, TaskId, TaskKey, TxReceiptLike } from '../types.js';

export interface AgentDeps {
  escrow: BlindEscrowClient;
  storage: Storage;
  keystore: KeyStore;
  signer: Signer;
  events?: EventBus<SdkEvents>;
}

export interface CreateTaskInput {
  instructions: string | Uint8Array;
  category: string;
  locationZone: string;
  reward: Reward & { token: Address };
  deadline: Date | bigint;
}

export interface CreateTaskResult {
  taskId: TaskId;
  taskKey: TaskKey;
  rootHash: Hex;
  txHash: Hex;
  receipt: TxReceiptLike;
}

export interface AssignWorkerResult {
  wrappedKey: Uint8Array;
  receipt: TxReceiptLike;
}

/**
 * End-to-end agent flows. Composes storage + crypto + chain + keystore so a
 * caller can post an encrypted bounty in one call. Key exchange with the
 * worker is intentionally out-of-band: assignWorker() returns the wrapped
 * AES key as bytes, and the caller is responsible for delivering it (backend
 * API, DM, whatever). This keeps the SDK pluggable across different
 * message-passing substrates.
 */
export class Agent {
  constructor(private readonly deps: AgentDeps) {}

  async createTask(input: CreateTaskInput): Promise<CreateTaskResult> {
    const { storage, escrow, keystore, events } = this.deps;

    const aesKey = await generateAesKey();
    const plaintext = toBytes(input.instructions);
    const ciphertext = await aesEncrypt(plaintext, aesKey);

    const uploaded = await storage.upload(ciphertext);
    const rootHash = uploaded.rootHash;

    const deadline = typeof input.deadline === 'bigint' ? input.deadline : BigInt(Math.floor(input.deadline.getTime() / 1000));

    const { taskId, receipt } = await escrow.createTask({
      taskHash: rootHash,
      token: input.reward.token as Address,
      amount: input.reward.amount,
      category: input.category,
      locationZone: input.locationZone,
      deadline,
    });

    const taskKey: TaskKey = { aesKey, createdAt: new Date() };
    await keystore.putTaskKey(taskId, taskKey);

    events?.emit('task.created', { taskId, txHash: receipt.hash, rootHash });
    return { taskId, taskKey, rootHash, txHash: receipt.hash, receipt };
  }

  /**
   * Wrap the stored AES key for the chosen worker and record the assignment
   * on-chain. The caller must deliver `wrappedKey` to the worker separately
   * (backend API, DM, etc.). Returns the wrapped bytes and the tx receipt.
   */
  async assignWorker(taskId: TaskId, worker: Address, workerPubKey: string): Promise<AssignWorkerResult> {
    const { keystore, escrow, events } = this.deps;
    const stored = await keystore.getTaskKey(taskId);
    if (!stored) {
      throw new LifecycleError('LIFECYCLE/TASK_NOT_FOUND', `no task key in keystore for task ${taskId}`);
    }
    const wrappedKey = await eciesEncrypt(stored.aesKey, workerPubKey);
    const receipt = await escrow.assignWorker(taskId, worker);
    events?.emit('task.assigned', { taskId, worker, txHash: receipt.hash });
    return { wrappedKey, receipt };
  }

  async cancelTask(taskId: TaskId): Promise<TxReceiptLike> {
    const { escrow, keystore, events } = this.deps;
    const receipt = await this.deps.escrow.cancelTask(taskId);
    void escrow;
    await keystore.delete(taskId);
    events?.emit('task.cancelled', { taskId, txHash: receipt.hash });
    return receipt;
  }

  /**
   * Fetch evidence by root hash, unwrap the AES key with the agent's private
   * key (signer's key material is not accessible, so a raw private key is
   * required), and return the decrypted evidence plaintext.
   */
  async fetchAndDecryptEvidence(evidenceHash: Hex, agentPrivKey: string): Promise<Uint8Array> {
    const envelope = await this.deps.storage.download(evidenceHash);
    return openEvidenceAsAgent(envelope, agentPrivKey);
  }
}

function toBytes(x: string | Uint8Array): Uint8Array {
  return typeof x === 'string' ? new TextEncoder().encode(x) : x;
}
