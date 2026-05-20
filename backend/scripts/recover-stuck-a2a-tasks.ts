/**
 * One-shot recovery for A2A tasks stuck after the NOT_INDEXED bug.
 *
 * Symptom: agent accepted a task locally (a2aStore state='accepted' or
 * 'in_progress'), but settleAssignment's background marketplaceAssign call
 * timed out waiting on the hash→id lookup, so the on-chain task is still
 * in Funded state with no executor. The agent then failed /submit with
 * 503 NOT_INDEXED, bailed out, and lost the result data.
 *
 * Recovery: reset the local a2a state back to 'open' so the agent's next
 * poll cycle re-picks the task naturally. With the escrowEvents.ts patch
 * in place, the re-accept path will now succeed (hash→id resolves via the
 * on-demand backfill) and the task flows end-to-end.
 *
 * Usage:
 *   cd backend
 *   npx tsx scripts/recover-stuck-a2a-tasks.ts 0xa8bca16c... 0xde6a9528... 0xcb2be69c... 0x76ed44a6...
 *
 * Stop the affected agent before running so the reset doesn't race with
 * an in-flight LLM call. Restart it after; it will re-pick the tasks.
 */

import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.resolve(__dirname, '../.env') });

import { redis } from '../src/services/redis.js';
import * as a2aStore from '../src/services/a2aStore.js';
import { escrow } from '../src/services/chain.js';
import { getTaskIdByHash } from '../src/services/escrowEvents.js';

const STUCK_LOCAL_STATUSES = new Set(['accepted', 'in_progress', 'submitted']);

async function recoverOne(taskHash: string): Promise<void> {
  const short = taskHash.slice(0, 10);
  console.log(`\n── ${short}… ──`);

  const state = await a2aStore.getState(taskHash);
  if (!state) {
    console.log(`  no local state — nothing to do`);
    return;
  }
  console.log(`  local: status=${state.status} executor=${state.executorAddress ?? '(none)'}`);

  if (!STUCK_LOCAL_STATUSES.has(state.status)) {
    console.log(`  status not in stuck set — skipping`);
    return;
  }

  // Verify on-chain state. If the task is actually past Funded, the local
  // store is just behind — don't reset, it'll catch up naturally.
  const onChainId = await getTaskIdByHash(taskHash);
  if (!onChainId) {
    console.log(`  hash→id still not resolvable even after backfill — task may genuinely not exist on this chain; skipping`);
    return;
  }
  console.log(`  on-chain id: ${onChainId}`);

  const task = await escrow.getTask(BigInt(onChainId));
  // BlindEscrow status enum: 0=Funded, 1=Assigned, 2=Submitted, 3=Completed, 4=Cancelled
  const chainStatusName = ['Funded', 'Assigned', 'Submitted', 'Completed', 'Cancelled'][Number(task.status)] ?? `Unknown(${task.status})`;
  console.log(`  on-chain status: ${chainStatusName}, executor: ${task.worker}`);

  if (Number(task.status) !== 0) {
    console.log(`  chain is past Funded (status=${chainStatusName}) — resetting local would break re-pickup; skipping`);
    return;
  }

  // Confirmed stuck: chain Funded, local accepted/in_progress/submitted with executor.
  // Reset local state to 'open' so the agent's poll loop sees it as available.
  // Lower-cased state key matches a2aStore conventions.
  const tid = taskHash.toLowerCase();
  const meta = await a2aStore.getMeta(taskHash);
  if (!meta) {
    console.log(`  no meta — cannot reset cleanly; skipping`);
    return;
  }

  const pipe = redis.pipeline();
  pipe.set(
    `a2a:state:${tid}`,
    JSON.stringify({ taskId: tid, status: 'open' }),
  );
  // Re-add to the open index if the target is an agent (so browseAgentTasks
  // returns it). Re-add unconditionally — meta.targetExecutorType gates it.
  if (meta.targetExecutorType === 'agent') {
    pipe.sadd('a2a:open', tid);
  }
  // Drop from the previous executor's index so they don't re-claim ownership
  // when they re-accept (the new accept call sets the index correctly).
  if (state.executorAddress) {
    pipe.srem(`a2a:executor:${state.executorAddress.toLowerCase()}`, tid);
  }
  await pipe.exec();
  console.log(`  RESET → local state=open, removed from executor index for ${state.executorAddress}`);
}

async function main(): Promise<void> {
  const hashes = process.argv.slice(2).filter((s) => s.startsWith('0x'));
  if (hashes.length === 0) {
    console.error('Usage: npx tsx scripts/recover-stuck-a2a-tasks.ts <taskHash> [<taskHash>...]');
    process.exit(1);
  }
  console.log(`recovering ${hashes.length} task(s)…`);
  for (const h of hashes) {
    try {
      await recoverOne(h);
    } catch (e) {
      console.error(`  ERROR for ${h.slice(0, 10)}…:`, (e as Error).message);
    }
  }
  await redis.quit();
  console.log('\ndone.');
}

main().catch((e) => {
  console.error('fatal:', e);
  process.exit(1);
});
