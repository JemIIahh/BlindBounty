/**
 * One-shot cleanup for stale A2A test fixtures.
 *
 * Identifies test TASKS by two heuristics:
 *   1. posterAddress matches POSTER_PRIVATE_KEY (the well-known smoke-test
 *      poster baked into smoketest-a2a.ts + smoketest-a2a-extensive.ts).
 *   2. posterAddress has exactly ONE task in Redis (throwaway wallet pattern
 *      used by smoketest-path1-wrap.ts and smoketest-worker-retry.ts —
 *      each scenario spins up a fresh Wallet.createRandom and never reuses).
 *
 * Identifies test AGENTS by displayName prefix (path1-smoke-exec, exec-,
 * WorkerRetrySmoke, smoketest, extensive-smoketest). Real agents registered
 * via the platform UI / agentRunner don't use these prefixes.
 *
 * For each task hit, drops: a2a:meta:<hash>, a2a:state:<hash>,
 * a2a:bids:<hash>, and the entries in a2a:open / a2a:poster:<addr> /
 * a2a:executor:<addr>. For each agent hit, drops agent:executor:<addr>
 * and removes from agent:executor:all.
 *
 *   npx tsx scripts/cleanup-test-tasks.ts          # actually delete
 *   npx tsx scripts/cleanup-test-tasks.ts --dry    # preview only
 *   npx tsx scripts/cleanup-test-tasks.ts --all    # also drop multi-task
 *                                                  # posters (use with care)
 */

import 'dotenv/config';
import { config as dotenvConfig } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync, readFileSync } from 'fs';
import { Wallet } from 'ethers';
import Redis from 'ioredis';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const backendEnvPath = resolve(__dirname, '../.env');
const contractsEnvPath = resolve(__dirname, '../../contracts/.env');
if (existsSync(backendEnvPath)) dotenvConfig({ path: backendEnvPath, override: false });
if (existsSync(contractsEnvPath)) dotenvConfig({ path: contractsEnvPath, override: false });

const REDIS_URL = process.env.REDIS_URL;
if (!REDIS_URL) {
  console.error('REDIS_URL missing — set it in backend/.env');
  process.exit(1);
}

const DRY = process.argv.includes('--dry');
const ALL = process.argv.includes('--all');

const c = {
  dim: (s: string) => `\x1b[2m${s}\x1b[0m`,
  green: (s: string) => `\x1b[32m${s}\x1b[0m`,
  red: (s: string) => `\x1b[31m${s}\x1b[0m`,
  yellow: (s: string) => `\x1b[33m${s}\x1b[0m`,
  bold: (s: string) => `\x1b[1m${s}\x1b[0m`,
};

function knownSmokePoster(): string | null {
  // Mirror smoketest-a2a*.ts env-loading: contracts/.env first, then backend/.env.
  const tryRead = (p: string): string | null => {
    if (!existsSync(p)) return null;
    const m = readFileSync(p, 'utf8').match(/POSTER_PRIVATE_KEY=([^\s\n]+)/);
    return m ? m[1] : null;
  };
  const pk = tryRead(contractsEnvPath) ?? tryRead(backendEnvPath);
  if (!pk) return null;
  try {
    return new Wallet(pk.startsWith('0x') ? pk : '0x' + pk).address.toLowerCase();
  } catch {
    return null;
  }
}

async function main() {
  const redis = new Redis(REDIS_URL!, { maxRetriesPerRequest: null });

  const banner = DRY ? c.yellow('(DRY RUN)') : ALL ? c.red('(LIVE · ALL)') : c.red('(LIVE)');
  console.log(c.bold(`\n═══ A2A test-task cleanup ${banner} ═══\n`));

  const smokePoster = knownSmokePoster();
  console.log(c.dim(`  Known smoke poster: ${smokePoster ?? '(POSTER_PRIVATE_KEY not found)'}\n`));

  // Pull every a2a:meta:* via SCAN.
  const metaKeys = new Set<string>();
  let cursor = '0';
  do {
    const [next, batch] = await redis.scan(cursor, 'MATCH', 'a2a:meta:*', 'COUNT', 500);
    cursor = next;
    for (const k of batch) metaKeys.add(k);
  } while (cursor !== '0');

  // Load all metas + bucket by poster.
  interface Entry { taskHash: string; meta: any; }
  const entries: Entry[] = [];
  for (const key of metaKeys) {
    const raw = await redis.get(key);
    if (!raw) continue;
    try {
      const meta = JSON.parse(raw);
      const taskHash = key.replace(/^a2a:meta:/, '');
      entries.push({ taskHash, meta });
    } catch {}
  }

  const byPoster = new Map<string, Entry[]>();
  for (const e of entries) {
    const p = (e.meta.posterAddress as string | undefined)?.toLowerCase() ?? '<no-poster>';
    if (!byPoster.has(p)) byPoster.set(p, []);
    byPoster.get(p)!.push(e);
  }

  console.log(`  scanned ${entries.length} meta entries from ${byPoster.size} posters\n`);

  // Selection
  const hits: Entry[] = [];
  for (const [poster, posterEntries] of byPoster) {
    if (ALL) {
      for (const e of posterEntries) hits.push(e);
      continue;
    }
    if (smokePoster && poster === smokePoster) {
      for (const e of posterEntries) hits.push(e);
      continue;
    }
    if (posterEntries.length === 1) {
      // Throwaway-wallet heuristic: single task per poster.
      hits.push(posterEntries[0]!);
    }
  }

  if (hits.length === 0) {
    console.log(`  ${c.green('✓')} no test tasks to clean\n`);
  } else {

  console.log(`  ${c.yellow('!')} would remove ${hits.length} task(s):\n`);
  // Group by poster for compact output
  const grouped = new Map<string, Entry[]>();
  for (const h of hits) {
    const p = (h.meta.posterAddress as string | undefined)?.toLowerCase() ?? '<none>';
    if (!grouped.has(p)) grouped.set(p, []);
    grouped.get(p)!.push(h);
  }
  for (const [poster, list] of [...grouped.entries()].sort((a, b) => b[1].length - a[1].length)) {
    const tag = poster === smokePoster ? c.dim(' · known smoke poster') : list.length === 1 ? c.dim(' · throwaway') : '';
    console.log(c.dim(`    ${poster}  (${list.length} task${list.length === 1 ? '' : 's'})${tag}`));
    for (const h of list.slice(0, 5)) {
      console.log(c.dim(`      ${h.taskHash.slice(0, 14)}…`));
    }
    if (list.length > 5) console.log(c.dim(`      … +${list.length - 5} more`));
  }
  console.log('');

  if (DRY) {
    console.log(c.yellow('  (dry run — no keys deleted)\n'));
    await redis.quit();
    return;
  }

  // Delete in pipelined batches.
  let deleted = 0;
  for (const h of hits) {
    const taskHash = h.taskHash;
    const meta = h.meta;
    const stateRaw = await redis.get(`a2a:state:${taskHash}`);
    let executor: string | undefined;
    if (stateRaw) {
      try { executor = JSON.parse(stateRaw).executorAddress as string | undefined; } catch {}
    }
    const pipe = redis.pipeline();
    pipe.del(`a2a:meta:${taskHash}`);
    pipe.del(`a2a:state:${taskHash}`);
    pipe.del(`a2a:bids:${taskHash}`);
    pipe.srem('a2a:open', taskHash);
    if (meta.posterAddress) {
      pipe.srem(`a2a:poster:${(meta.posterAddress as string).toLowerCase()}`, taskHash);
    }
    if (executor) {
      pipe.srem(`a2a:executor:${executor.toLowerCase()}`, taskHash);
    }
    await pipe.exec();
    deleted++;
  }
  console.log(c.green(`  ✓ deleted ${deleted} test task(s)\n`));

  // Sanity check the open set + report orphans
  const openLeft = await redis.scard('a2a:open');
  console.log(c.dim(`  a2a:open now has ${openLeft} task(s)\n`));

  } // end task-hits guard

  // ── Agent registrations cleanup ────────────────────────────────────────
  // Test agents are identified by displayName prefix. Real agents
  // (registered via the UI or agentRunner) don't use these prefixes.
  const TEST_AGENT_PREFIXES = ['path1-smoke-exec', 'exec-', 'WorkerRetrySmoke', 'smoketest', 'extensive-smoketest'];
  const agentKeys = new Set<string>();
  cursor = '0';
  do {
    const [next, batch] = await redis.scan(cursor, 'MATCH', 'agent:executor:*', 'COUNT', 500);
    cursor = next;
    for (const k of batch) agentKeys.add(k);
  } while (cursor !== '0');

  const agentHits: Array<{ key: string; addr: string; name: string }> = [];
  for (const k of agentKeys) {
    if (k === 'agent:executor:all') continue;
    const raw = await redis.get(k);
    if (!raw) continue;
    try {
      const a = JSON.parse(raw);
      const name = a.displayName ?? '';
      if (TEST_AGENT_PREFIXES.some((p) => name === p || name.startsWith(p))) {
        agentHits.push({ key: k, addr: (a.address ?? '').toLowerCase(), name });
      }
    } catch {}
  }

  if (agentHits.length === 0) {
    console.log(c.dim(`  no test agent registrations to clean\n`));
    await redis.quit();
    return;
  }

  console.log(`  ${c.yellow('!')} ${ALL || !DRY ? 'removing' : 'would remove'} ${agentHits.length} test agent(s):\n`);
  for (const a of agentHits) {
    console.log(c.dim(`    ${a.name.padEnd(28)} ${a.addr}`));
  }
  console.log('');

  if (!DRY) {
    let agentsDeleted = 0;
    for (const a of agentHits) {
      const pipe = redis.pipeline();
      pipe.del(a.key);
      if (a.addr) pipe.srem('agent:executor:all', a.addr);
      await pipe.exec();
      agentsDeleted++;
    }
    console.log(c.green(`  ✓ deleted ${agentsDeleted} test agent(s)\n`));
    const agentsLeft = await redis.scard('agent:executor:all');
    console.log(c.dim(`  agent:executor:all now has ${agentsLeft} executor(s)\n`));
  } else {
    console.log(c.yellow('  (dry run — no agent keys deleted)\n'));
  }

  await redis.quit();
}

main().catch((e) => {
  console.error(c.red('[fatal]'), e);
  process.exit(1);
});
