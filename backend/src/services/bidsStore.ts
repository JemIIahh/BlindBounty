import { redis } from './redis.js';
import type { AgentCapability } from '../types.js';

// ── Keys ─────────────────────────────────────────────────────────────────────
//
// Persistence model:
//   a2a:bids:<taskId>  — hash of (lowercased address → JSON of BidRecord)
//
// One hash per task is enough — bids are small (<200 bytes each) and a task
// rarely accumulates more than a handful of bidders before a poster wraps to
// them. If a task explodes past hundreds of bids, the hash still reads back
// in one HGETALL and we can paginate later if it ever matters.

const KEY = {
  bids: (taskId: string) => `a2a:bids:${taskId}`,
};

export interface BidRecord {
  address: string;
  publicKey: string;
  capabilities: AgentCapability[];
  bidAt: string;
}

/**
 * Record an executor's intent to take a task. Idempotent — re-bidding from the
 * same address just refreshes the bidAt timestamp. We deliberately store the
 * pubkey here (already on the agent record) so the poster's wrap step can be a
 * single HGETALL without a second lookup per bidder.
 */
export async function addBid(taskId: string, bid: BidRecord): Promise<void> {
  await redis.hset(
    KEY.bids(taskId),
    bid.address.toLowerCase(),
    JSON.stringify({ ...bid, address: bid.address.toLowerCase() }),
  );
}

/** Read all bids for a task. Returns an empty array if no one has bid yet. */
export async function listBids(taskId: string): Promise<BidRecord[]> {
  const map = await redis.hgetall(KEY.bids(taskId));
  if (!map) return [];
  const out: BidRecord[] = [];
  for (const v of Object.values(map)) {
    if (typeof v !== 'string') continue;
    try {
      out.push(JSON.parse(v) as BidRecord);
    } catch {
      // Skip malformed rows rather than failing the whole listing.
    }
  }
  return out;
}

/** Has this address already bid on this task? Cheaper than listBids for the
 *  idempotency check at /bid time. */
export async function hasBid(taskId: string, address: string): Promise<boolean> {
  return (await redis.hexists(KEY.bids(taskId), address.toLowerCase())) === 1;
}

/**
 * Drop the bid index for a completed/cancelled task. Called from the lifecycle
 * paths so finished tasks don't leak bid records into Redis forever.
 */
export async function clearBids(taskId: string): Promise<void> {
  await redis.del(KEY.bids(taskId));
}
