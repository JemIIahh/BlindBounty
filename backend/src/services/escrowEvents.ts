import type { EventLog } from 'ethers';
import { escrow, provider } from './chain.js';
import { redis } from './redis.js';

// ── Keys ─────────────────────────────────────────────────────────────────────
//
// Bidirectional mapping between the bytes32 taskHash (used as the A2A store
// key) and the on-chain uint256 taskId (needed for assignWorker /
// completeVerification). Hash side is lowercased to defang any mixed-case
// inputs from the createTask schema (which permits [0-9a-fA-F]).
//
//   a2a:hash2id:<lowercased_hash>  → string of uint256 taskId
//   a2a:id2hash:<taskId>           → 0x-prefixed lowercased hash
//   a2a:events:checkpoint          → last block number processed (string)
//
// All writes are idempotent (SET overwrite with identical value), so
// at-least-once delivery from the poll loop is safe.

const KEY = {
  hash2id: (hash: string) => `a2a:hash2id:${hash.toLowerCase()}`,
  id2hash: (taskId: bigint | string) => `a2a:id2hash:${String(taskId)}`,
  checkpoint: 'a2a:events:checkpoint',
};

const POLL_INTERVAL_MS = 30_000;

let timer: NodeJS.Timeout | null = null;
let inFlight = false;

async function tick(): Promise<void> {
  // Skip re-entry: a slow RPC could otherwise stack overlapping ticks.
  if (inFlight) return;
  inFlight = true;
  try {
    const latest = await provider.getBlockNumber();
    const checkpointRaw = await redis.get(KEY.checkpoint);

    // First run: pin checkpoint at the current head and start polling forward.
    // Historical tasks pre-date A2A persistence, so backfill has no callers.
    let from: number;
    if (checkpointRaw) {
      from = Number(checkpointRaw) + 1;
    } else {
      from = latest;
      await redis.set(KEY.checkpoint, String(latest));
    }
    if (from > latest) return;

    const filter = escrow.filters.TaskCreated();
    const events = await escrow.queryFilter(filter, from, latest);

    if (events.length > 0) {
      const pipe = redis.pipeline();
      for (const ev of events) {
        // queryFilter on a contract filter returns EventLog with typed args.
        // Defensive cast covers the (EventLog | Log) union ethers narrows to.
        const args = (ev as EventLog).args;
        if (!args) continue;
        const taskId = args.taskId as bigint | undefined;
        const taskHash = args.taskHash as string | undefined;
        if (taskId === undefined || !taskHash) continue;
        pipe.set(KEY.hash2id(taskHash), String(taskId));
        pipe.set(KEY.id2hash(taskId), taskHash.toLowerCase());
      }
      await pipe.exec();
      console.log(
        `[escrowEvents] processed ${events.length} TaskCreated event(s) (blocks ${from}..${latest})`,
      );
    }

    await redis.set(KEY.checkpoint, String(latest));
  } catch (e) {
    // Swallow & log — we want the loop to keep going. RPC blips and Redis
    // disconnects are transient; the next tick will retry from the same
    // checkpoint (no events lost).
    console.error('[escrowEvents] tick error:', (e as Error).message);
  } finally {
    inFlight = false;
  }
}

export function startEscrowEventLoop(): void {
  if (timer) return; // idempotent — safe to call from multiple boot paths
  void tick(); // run immediately so we don't wait 30s for the first capture
  timer = setInterval(tick, POLL_INTERVAL_MS);
  console.log(`[escrowEvents] polling TaskCreated every ${POLL_INTERVAL_MS / 1000}s`);
}

export function stopEscrowEventLoop(): void {
  if (timer) clearInterval(timer);
  timer = null;
}

// ── Lookup helpers (used by the settlement bridge) ──────────────────────────

/** Resolve a taskHash to its on-chain uint256 taskId, or null if not yet seen. */
export async function getTaskIdByHash(taskHash: string): Promise<string | null> {
  return redis.get(KEY.hash2id(taskHash));
}

/** Resolve an on-chain taskId back to its taskHash, or null if not seen. */
export async function getTaskHashById(taskId: bigint | string | number): Promise<string | null> {
  return redis.get(KEY.id2hash(typeof taskId === 'number' ? BigInt(taskId) : taskId));
}
