import { useEffect, useRef } from 'react';
import { authedGet, authedPost } from '../lib/api';
import { eciesEncrypt } from '../lib/crypto';
import { getAesKey, listStashedHashes, clearAesKey } from '../lib/keyStash';

/**
 * Just-in-time wrap loop for tasks the poster owns.
 *
 * For each stashed AES key:
 *   1. GET /a2a/tasks/:hash/bids — pull pending bidders and the set of
 *      addresses already wrapped to.
 *   2. For each bidder NOT yet wrapped, ECIES-encrypt the AES key to their
 *      pubkey.
 *   3. POST /a2a/tasks/:hash/wrap-to with the new slice(s). Backend merges
 *      into meta.wrappedKeys; the bidder's next /accept call will succeed.
 *
 * Failure modes are absorbed (network blips, 404 if the task isn't a2a-indexed
 * yet, 403 NOT_POSTER if a stale key was left over for someone else's task)
 * and the loop continues — getting interrupted shouldn't lose other bids.
 *
 * Mount this from any page the poster naturally sits on (e.g. /my_tasks).
 * Unmount stops the timer. The hook is a no-op when there are no stashed
 * keys (returns early without scheduling a tick).
 */

interface BidRecord {
  address: string;
  publicKey: string;
  capabilities: string[];
  bidAt: string;
}

interface BidsResp {
  taskId: string;
  bids: BidRecord[];
  wrapped: string[];
}

const POLL_MS = 8000;

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

export function useBidWatcher(enabled: boolean): void {
  // Guard against overlapping ticks if a fetch lags past the interval.
  const inFlight = useRef(false);

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;

    async function tick(): Promise<void> {
      if (inFlight.current) return;
      inFlight.current = true;
      try {
        const hashes = listStashedHashes();
        if (hashes.length === 0) return;

        for (const taskHash of hashes) {
          if (cancelled) return;

          const key = getAesKey(taskHash);
          if (!key) continue;

          let resp: { success: boolean; data: BidsResp };
          try {
            resp = await authedGet<{ success: boolean; data: BidsResp }>(
              `/api/v1/a2a/tasks/${taskHash}/bids`,
            );
          } catch (e: any) {
            // 404 → task isn't a2a-indexed (yet, or ever); 403 → we're not
            // the poster; either way drop the stash so we stop hitting it.
            if (e?.status === 404 || e?.status === 403) {
              console.warn(`[bidWatcher] dropping stash for ${taskHash}:`, e.code);
              clearAesKey(taskHash);
            }
            continue;
          }

          const bids = resp.data?.bids ?? [];
          const wrappedSet = new Set((resp.data?.wrapped ?? []).map((a) => a.toLowerCase()));
          const pending = bids.filter((b) => !wrappedSet.has(b.address.toLowerCase()));
          if (pending.length === 0) continue;

          const additions: Record<string, string> = {};
          for (const bid of pending) {
            try {
              const wrapped = await eciesEncrypt(key, bid.publicKey);
              additions[bid.address.toLowerCase()] = bytesToHex(wrapped);
            } catch (e) {
              console.warn(
                `[bidWatcher] skipped ${bid.address} on ${taskHash} (wrap failed):`,
                (e as Error).message,
              );
            }
          }
          if (Object.keys(additions).length === 0) continue;

          try {
            await authedPost(`/api/v1/a2a/tasks/${taskHash}/wrap-to`, {
              wrappedKeys: additions,
            });
            console.log(
              `[bidWatcher] wrapped ${Object.keys(additions).length} new bidder(s) on ${taskHash}`,
            );
          } catch (e: any) {
            console.warn(
              `[bidWatcher] wrap-to POST failed for ${taskHash}:`,
              e?.code ?? e?.message ?? e,
            );
          }
        }
      } finally {
        inFlight.current = false;
      }
    }

    void tick();
    const id = window.setInterval(tick, POLL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [enabled]);
}
