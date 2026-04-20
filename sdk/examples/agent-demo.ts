/**
 * Agent → Worker end-to-end demo, using MemoryStorage + a mock escrow so the
 * script runs anywhere without an RPC or funded wallet. Shows the full flow:
 *
 *   1. Agent creates an encrypted task (AES-encrypt instructions, upload blob)
 *   2. Agent assigns a worker (ECIES-wrap the AES key to worker's pubkey)
 *   3. Worker decrypts the instructions
 *   4. Worker submits evidence (seals a dual-recipient envelope for agent + TEE)
 *   5. Agent decrypts the evidence
 *
 * Run from sdk/:  npx tsx examples/agent-demo.ts
 *
 * For the real chain, swap MockEscrow for `new ChainClient({ network, signer }).escrow`
 * and swap MemoryStorage for `new ZgStorage({ indexerUrl, rpcUrl, signer: ethersWallet })`.
 */
import { Agent } from '../src/agent/index.js';
import type { BlindEscrowClient, CreateTaskArgs } from '../src/chain/index.js';
import { generateKeyPair } from '../src/crypto/index.js';
import { EventBus, type SdkEvents } from '../src/events/index.js';
import { InMemoryKeyStore } from '../src/keystore/index.js';
import { PrivateKeySigner } from '../src/signer/index.js';
import { MemoryStorage } from '../src/storage/index.js';
import type { Address, Hex, RootHash, TaskId, TxReceiptLike } from '../src/types.js';
import { Worker } from '../src/worker/index.js';

// ── Mock escrow for offline demo (use real ChainClient in production) ──
class MockEscrow {
  private nextId = 1n;
  private evidenceByTask = new Map<string, RootHash>();
  async createTask(args: CreateTaskArgs) {
    const taskId = this.nextId++;
    return { taskId, receipt: r('0xa') };
  }
  async assignWorker(_taskId: TaskId, _worker: Address) { return r('0xb'); }
  async cancelTask(_taskId: TaskId) { return r('0xc'); }
  async submitEvidence(taskId: TaskId, evidenceHash: Hex) {
    this.evidenceByTask.set(taskId.toString(), evidenceHash as RootHash);
    return r('0xd');
  }
  getEvidenceHash(taskId: TaskId) { return this.evidenceByTask.get(taskId.toString()); }
}
function r(prefix: string): TxReceiptLike {
  return { hash: (prefix + 'f'.repeat(63 - prefix.length + 2)).slice(0, 66) as Hex, blockNumber: 1, gasUsed: 21000n };
}

// ── Shared deps ──
const AGENT_PK = '0x' + '1'.repeat(64);
const WORKER_PK = '0x' + '2'.repeat(64);
const USDC = '0x317227efcA18D004E12CA8046AEf7E1597458F25' as Address;

const storage = new MemoryStorage();
const escrow = new MockEscrow();
const events = new EventBus<SdkEvents>();
events.on('task.created', (p) => console.log(`  • task.created taskId=${p.taskId} rootHash=${p.rootHash.slice(0, 18)}…`));
events.on('task.assigned', (p) => console.log(`  • task.assigned taskId=${p.taskId} worker=${p.worker.slice(0, 10)}…`));
events.on('evidence.submitted', (p) => console.log(`  • evidence.submitted taskId=${p.taskId} rootHash=${p.rootHash.slice(0, 18)}…`));

// ── Identities ──
const agentSigner = new PrivateKeySigner(AGENT_PK);
const workerSigner = new PrivateKeySigner(WORKER_PK);
const agentPubKey = await agentSigner.getPublicKey();
const workerPubKey = await workerSigner.getPublicKey();
const workerAddr = (await workerSigner.getAddress()) as Address;
const enclaveKeys = generateKeyPair(); // TEE pubkey — fetched from broker in production

const agent = new Agent({
  // biome-ignore lint/suspicious/noExplicitAny: demo mock
  escrow: escrow as any as BlindEscrowClient,
  storage,
  keystore: new InMemoryKeyStore(),
  signer: agentSigner,
  events,
});
const worker = new Worker({
  // biome-ignore lint/suspicious/noExplicitAny: demo mock
  escrow: escrow as any as BlindEscrowClient,
  // biome-ignore lint/suspicious/noExplicitAny: demo: no registry needed for this path
  registry: null as any,
  storage,
  signer: workerSigner,
  events,
});

// ── 1. Agent creates an encrypted task ──
console.log('\n[1] Agent creates encrypted task');
const created = await agent.createTask({
  instructions: 'Take 3 photos of the storefront at 123 Main St, Lagos',
  category: 'photography',
  locationZone: 'Lagos, NG',
  reward: { token: USDC, amount: 5_000000n },
  deadline: new Date(Date.now() + 24 * 3600_000),
});

// ── 2. Agent assigns the worker ──
console.log('\n[2] Agent assigns worker (wraps AES key to worker pubkey)');
const { wrappedKey } = await agent.assignWorker(created.taskId, workerAddr, workerPubKey);

// ── 3. Worker decrypts the instructions ──
console.log('\n[3] Worker decrypts instructions');
const instructions = await worker.decryptInstructions({
  wrappedKey,
  workerPrivKey: WORKER_PK,
  taskHash: created.rootHash,
});
console.log(`  → "${new TextDecoder().decode(instructions)}"`);

// ── 4. Worker submits evidence ──
console.log('\n[4] Worker submits evidence (dual-recipient envelope: agent + TEE)');
const submitted = await worker.submitEvidence({
  taskId: created.taskId,
  evidence: 'photo1.jpg photo2.jpg photo3.jpg (attached)',
  agentPubKey,
  enclavePubKey: enclaveKeys.publicKey,
});

// ── 5. Agent fetches + decrypts evidence ──
console.log('\n[5] Agent decrypts evidence');
const recovered = await agent.fetchAndDecryptEvidence(submitted.rootHash, AGENT_PK);
console.log(`  → "${new TextDecoder().decode(recovered)}"`);

console.log('\n✓ full lifecycle completed');
