import { describe, expect, it } from 'vitest';
import type {
  BlindEscrowClient,
  CreateTaskArgs,
  OnChainTask,
  TaskRegistryClient,
} from '../src/chain/index.js';
import {
  aesEncrypt,
  eciesEncrypt,
  generateAesKey,
  generateKeyPair,
  openEvidenceAsAgent,
} from '../src/crypto/index.js';
import { EventBus, type SdkEvents } from '../src/events/index.js';
import { PrivateKeySigner } from '../src/signer/index.js';
import { MemoryStorage } from '../src/storage/index.js';
import type { Address, Hex, RootHash, TaskId, TxReceiptLike } from '../src/types.js';
import { Worker } from '../src/worker/index.js';

const WORKER_PK = '0x1000000000000000000000000000000000000000000000000000000000000001';
const FAKE_USDC = '0x317227efcA18D004E12CA8046AEf7E1597458F25' as Address;
const FAKE_TASK_HASH = `0x${'ab'.repeat(32)}` as Hex;

class MockEscrow {
  readonly calls: Array<{ method: string; args: unknown }> = [];
  async submitEvidence(taskId: TaskId, evidenceHash: Hex): Promise<TxReceiptLike> {
    this.calls.push({ method: 'submitEvidence', args: { taskId, evidenceHash } });
    return { hash: `0x${'11'.repeat(32)}` as Hex, blockNumber: 10, gasUsed: 21000n };
  }
  async claimTimeout(taskId: TaskId): Promise<TxReceiptLike> {
    this.calls.push({ method: 'claimTimeout', args: { taskId } });
    return { hash: `0x${'22'.repeat(32)}` as Hex, blockNumber: 20, gasUsed: 21000n };
  }
  async getTask(_taskId: TaskId): Promise<OnChainTask> {
    const t: OnChainTask = {
      taskId: 1n,
      agent: '0x0000000000000000000000000000000000000001' as Address,
      worker: '0x0000000000000000000000000000000000000002' as Address,
      token: FAKE_USDC,
      amount: 5_000000n,
      taskHash: FAKE_TASK_HASH,
      evidenceHash: `0x${'00'.repeat(32)}` as Hex,
      status: 'assigned',
      createdAt: new Date(),
      deadline: new Date(Date.now() + 3600_000),
    };
    return t;
  }
  // unused but required for shape
  async createTask(_args: CreateTaskArgs) {
    return { taskId: 1n, receipt: { hash: '0x' as Hex, blockNumber: 0, gasUsed: 0n } };
  }
}

class MockRegistry {
  async getOpenTasks(_offset: bigint, _limit: bigint): Promise<TaskId[]> {
    return [1n, 2n, 3n];
  }
}

function mkDeps() {
  const storage = new MemoryStorage();
  const signer = new PrivateKeySigner(WORKER_PK);
  const events = new EventBus<SdkEvents>();
  const escrow = new MockEscrow();
  const registry = new MockRegistry();
  return {
    storage,
    signer,
    events,
    escrow,
    registry,
    worker: new Worker({
      // biome-ignore lint/suspicious/noExplicitAny: mocks match the subset used
      escrow: escrow as any as BlindEscrowClient,
      // biome-ignore lint/suspicious/noExplicitAny: mocks match the subset used
      registry: registry as any as TaskRegistryClient,
      storage,
      signer,
      events,
    }),
  };
}

describe('Worker.browse + getTaskDetail', () => {
  it('delegates to registry.getOpenTasks', async () => {
    const { worker } = mkDeps();
    const ids = await worker.browse(0n, 10n);
    expect(ids).toEqual([1n, 2n, 3n]);
  });

  it('returns task detail from escrow.getTask', async () => {
    const { worker } = mkDeps();
    const detail = await worker.getTaskDetail(1n);
    expect(detail.status).toBe('assigned');
    expect(detail.token).toBe(FAKE_USDC);
  });
});

describe('Worker.decryptInstructions', () => {
  it('recovers plaintext instructions end-to-end', async () => {
    const { worker, storage, signer } = mkDeps();

    // Simulate agent side: generate AES key, encrypt instructions, upload, and
    // wrap AES key to worker pubkey.
    const aesKey = await generateAesKey();
    const instructions = new TextEncoder().encode('photograph the storefront at 123 Main St');
    const ciphertext = await aesEncrypt(instructions, aesKey);
    const { rootHash } = await storage.upload(ciphertext);
    const workerPub = await signer.getPublicKey();
    const wrappedKey = await eciesEncrypt(aesKey, workerPub);

    const decrypted = await worker.decryptInstructions({
      wrappedKey,
      workerPrivKey: WORKER_PK,
      taskHash: rootHash,
    });
    expect(new TextDecoder().decode(decrypted)).toBe('photograph the storefront at 123 Main St');
  });
});

describe('Worker.submitEvidence', () => {
  it('seals envelope + uploads + calls chain + emits event; agent can decrypt', async () => {
    const { worker, storage, escrow, events } = mkDeps();

    const agent = generateKeyPair();
    const enclave = generateKeyPair();

    const submitted: SdkEvents['evidence.submitted'][] = [];
    events.on('evidence.submitted', (p) => submitted.push(p));

    const res = await worker.submitEvidence({
      taskId: 42n,
      evidence: 'done: photos uploaded',
      agentPubKey: agent.publicKey,
      enclavePubKey: enclave.publicKey,
    });

    expect(res.rootHash).toMatch(/^0x[0-9a-f]{64}$/);
    expect(escrow.calls.some((c) => c.method === 'submitEvidence')).toBe(true);

    // Agent can download + decrypt the envelope
    const blob = await storage.download(res.rootHash as RootHash);
    const recovered = await openEvidenceAsAgent(blob, agent.privateKey);
    expect(new TextDecoder().decode(recovered)).toBe('done: photos uploaded');

    expect(submitted).toHaveLength(1);
    expect(submitted[0]?.taskId).toBe(42n);
    expect(submitted[0]?.rootHash).toBe(res.rootHash);
  });

  it('accepts Uint8Array evidence as well as strings', async () => {
    const { worker, storage } = mkDeps();
    const agent = generateKeyPair();
    const enclave = generateKeyPair();
    const res = await worker.submitEvidence({
      taskId: 1n,
      evidence: new Uint8Array([0xde, 0xad, 0xbe, 0xef]),
      agentPubKey: agent.publicKey,
      enclavePubKey: enclave.publicKey,
    });
    const blob = await storage.download(res.rootHash);
    const recovered = await openEvidenceAsAgent(blob, agent.privateKey);
    expect(Array.from(recovered)).toEqual([0xde, 0xad, 0xbe, 0xef]);
  });
});

describe('Worker.claimTimeout', () => {
  it('calls chain and emits payment.claimed', async () => {
    const { worker, escrow, events } = mkDeps();
    const claimed: SdkEvents['payment.claimed'][] = [];
    events.on('payment.claimed', (p) => claimed.push(p));

    const rec = await worker.claimTimeout(7n);
    expect(rec.hash).toMatch(/^0x[0-9a-f]{64}$/);
    expect(escrow.calls.some((c) => c.method === 'claimTimeout')).toBe(true);
    expect(claimed).toHaveLength(1);
    expect(claimed[0]?.taskId).toBe(7n);
  });
});
