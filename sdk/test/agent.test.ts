import { describe, expect, it } from 'vitest';
import { Agent } from '../src/agent/index.js';
import type { BlindEscrowClient, CreateTaskArgs } from '../src/chain/index.js';
import { aesDecrypt, eciesDecrypt, generateKeyPair, sealEvidence } from '../src/crypto/index.js';
import { EventBus, type SdkEvents } from '../src/events/index.js';
import { InMemoryKeyStore } from '../src/keystore/index.js';
import { PrivateKeySigner } from '../src/signer/index.js';
import { MemoryStorage } from '../src/storage/index.js';
import type { Address, Hex, TaskId, TxReceiptLike } from '../src/types.js';

const AGENT_PK = '0x0123456789012345678901234567890123456789012345678901234567890123';
const WORKER_PK = '0x1000000000000000000000000000000000000000000000000000000000000001';
const FAKE_USDC = '0x317227efcA18D004E12CA8046AEf7E1597458F25' as Address;
const FAKE_WORKER = '0x2000000000000000000000000000000000000002' as Address;

interface EscrowCall<M extends string> {
  method: M;
  args: unknown;
}

/**
 * In-memory BlindEscrow mock. Records every call for assertions and hands back
 * deterministic task ids / receipts so the Agent flow can be exercised without
 * a real chain.
 */
class MockEscrow {
  readonly calls: EscrowCall<'createTask' | 'assignWorker' | 'cancelTask'>[] = [];
  private nextId = 1n;

  async createTask(args: CreateTaskArgs) {
    this.calls.push({ method: 'createTask', args });
    const taskId = this.nextId++;
    const receipt: TxReceiptLike = { hash: `0x${'a'.repeat(64)}` as Hex, blockNumber: 1, gasUsed: 21000n };
    return { taskId, receipt };
  }

  async assignWorker(taskId: TaskId, worker: Address): Promise<TxReceiptLike> {
    this.calls.push({ method: 'assignWorker', args: { taskId, worker } });
    return { hash: `0x${'b'.repeat(64)}` as Hex, blockNumber: 2, gasUsed: 21000n };
  }

  async cancelTask(taskId: TaskId): Promise<TxReceiptLike> {
    this.calls.push({ method: 'cancelTask', args: { taskId } });
    return { hash: `0x${'c'.repeat(64)}` as Hex, blockNumber: 3, gasUsed: 21000n };
  }
}

function mkDeps() {
  const storage = new MemoryStorage();
  const keystore = new InMemoryKeyStore();
  const signer = new PrivateKeySigner(AGENT_PK);
  const events = new EventBus<SdkEvents>();
  const escrow = new MockEscrow();
  return {
    storage,
    keystore,
    signer,
    events,
    escrow,
    agent: new Agent({
      // biome-ignore lint/suspicious/noExplicitAny: MockEscrow matches the subset the Agent uses
      escrow: escrow as any as BlindEscrowClient,
      storage,
      keystore,
      signer,
      events,
    }),
  };
}

describe('Agent.createTask', () => {
  it('encrypts + uploads + calls chain + stashes key + emits event', async () => {
    const { agent, escrow, storage, keystore, events } = mkDeps();

    const emitted: SdkEvents['task.created'][] = [];
    events.on('task.created', (p) => {
      emitted.push(p);
    });

    const deadline = new Date(Date.now() + 3600_000);
    const res = await agent.createTask({
      instructions: 'Take 3 photos of the storefront',
      category: 'photography',
      locationZone: 'Lagos, NG',
      reward: { token: FAKE_USDC, amount: 5_000000n },
      deadline,
    });

    expect(res.taskId).toBe(1n);
    expect(res.rootHash).toMatch(/^0x[0-9a-f]{64}$/);
    expect(escrow.calls).toHaveLength(1);
    expect(escrow.calls[0]?.method).toBe('createTask');

    // Keystore now holds the task key for this id
    const stored = await keystore.getTaskKey(1n);
    expect(stored).not.toBeNull();
    expect(stored?.aesKey).toEqual(res.taskKey.aesKey);

    // The uploaded blob decrypts back to the original instructions
    const blob = await storage.download(res.rootHash);
    const pt = await aesDecrypt(blob, res.taskKey.aesKey);
    expect(new TextDecoder().decode(pt)).toBe('Take 3 photos of the storefront');

    // Event fired
    expect(emitted).toHaveLength(1);
    expect(emitted[0]?.taskId).toBe(1n);
    expect(emitted[0]?.rootHash).toBe(res.rootHash);
  });

  it('accepts Uint8Array instructions as well as strings', async () => {
    const { agent, storage } = mkDeps();
    const res = await agent.createTask({
      instructions: new Uint8Array([0xde, 0xad, 0xbe, 0xef]),
      category: 'x',
      locationZone: 'y',
      reward: { token: FAKE_USDC, amount: 1n },
      deadline: new Date(Date.now() + 3600_000),
    });
    const blob = await storage.download(res.rootHash);
    const pt = await aesDecrypt(blob, res.taskKey.aesKey);
    expect(Array.from(pt)).toEqual([0xde, 0xad, 0xbe, 0xef]);
  });
});

describe('Agent.assignWorker', () => {
  it('wraps the task AES key to the worker pubkey and calls chain', async () => {
    const { agent } = mkDeps();
    const created = await agent.createTask({
      instructions: 'hello',
      category: 'c',
      locationZone: 'z',
      reward: { token: FAKE_USDC, amount: 1n },
      deadline: new Date(Date.now() + 3600_000),
    });
    const worker = generateKeyPair();
    const result = await agent.assignWorker(created.taskId, FAKE_WORKER, worker.publicKey);

    // Worker can recover the AES key from the wrapped blob
    const recoveredKey = await eciesDecrypt(result.wrappedKey, worker.privateKey);
    expect(recoveredKey).toEqual(created.taskKey.aesKey);
  });

  it('throws LIFECYCLE/TASK_NOT_FOUND when task key is missing', async () => {
    const { agent } = mkDeps();
    const worker = generateKeyPair();
    await expect(agent.assignWorker(999n, FAKE_WORKER, worker.publicKey)).rejects.toMatchObject({
      code: 'LIFECYCLE/TASK_NOT_FOUND',
    });
  });
});

describe('Agent.cancelTask', () => {
  it('calls chain and removes the task key from keystore', async () => {
    const { agent, keystore, events } = mkDeps();
    const created = await agent.createTask({
      instructions: 'hello',
      category: 'c',
      locationZone: 'z',
      reward: { token: FAKE_USDC, amount: 1n },
      deadline: new Date(Date.now() + 3600_000),
    });
    expect(await keystore.getTaskKey(created.taskId)).not.toBeNull();

    const cancelled: SdkEvents['task.cancelled'][] = [];
    events.on('task.cancelled', (p) => cancelled.push(p));

    await agent.cancelTask(created.taskId);
    expect(await keystore.getTaskKey(created.taskId)).toBeNull();
    expect(cancelled).toHaveLength(1);
  });
});

describe('Agent.fetchAndDecryptEvidence', () => {
  it('downloads the envelope from storage and unwraps with agent privkey', async () => {
    const { agent, storage, signer } = mkDeps();
    const agentPub = await signer.getPublicKey();
    const enclave = generateKeyPair();

    const evidence = new TextEncoder().encode('photos + timestamps');
    const sealed = await sealEvidence({
      evidence,
      agentPubKey: agentPub,
      enclavePubKey: enclave.publicKey,
    });
    const { rootHash } = await storage.upload(sealed.envelope);

    const recovered = await agent.fetchAndDecryptEvidence(rootHash, AGENT_PK);
    expect(new TextDecoder().decode(recovered)).toBe('photos + timestamps');
  });
});

// silence unused-import warning for the imported pk
void WORKER_PK;
