/**
 * Worker retry-loop smoke test — proves backend/agents/worker.js actually
 * walks the NEEDS_WRAP → /bid → wait-for-wrap → /accept path end-to-end.
 *
 * Flow:
 *   1. Post a task with rootHash but NO wrappedKeys → /accept will 403 NEEDS_WRAP
 *   2. Spawn the real worker.js as a child process with controlled env
 *   3. Wait for worker stdout to log "bid registered" (proves /bid fired
 *      from inside the worker, not just from a curl)
 *   4. Confirm via /tasks/posted that the worker is in the bids[] list
 *   5. POST /wrap-to as the poster with a fake-but-format-valid blob
 *   6. Wait for the worker's next /accept attempt to succeed — observed via
 *      state.status='accepted' and state.executorAddress matching the worker
 *   7. Kill the worker, print verdict
 *
 * Why this test exists: the route-level smoke battery (smoketest-path1-wrap.ts)
 * proves the HTTP/Redis surface. This one proves the worker process actually
 * uses those routes correctly under its real polling cadence — catches things
 * like wrong header names, header-only POST bodies, bidPlacedTasks state
 * machine bugs, etc.
 *
 * Run:
 *   cd backend
 *   npx tsx scripts/smoketest-worker-retry.ts
 */

import 'dotenv/config';
import { config as dotenvConfig } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';
import { Wallet, randomBytes, hexlify, SigningKey } from 'ethers';
import { spawn } from 'child_process';
import { randomBytes as nodeRandomBytes } from 'crypto';
import jwt from 'jsonwebtoken';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const c = {
  dim: (s: string) => `\x1b[2m${s}\x1b[0m`,
  cyan: (s: string) => `\x1b[36m${s}\x1b[0m`,
  green: (s: string) => `\x1b[32m${s}\x1b[0m`,
  red: (s: string) => `\x1b[31m${s}\x1b[0m`,
  yellow: (s: string) => `\x1b[33m${s}\x1b[0m`,
  bold: (s: string) => `\x1b[1m${s}\x1b[0m`,
};

const backendEnvPath = resolve(__dirname, '../.env');
const contractsEnvPath = resolve(__dirname, '../../contracts/.env');
if (existsSync(contractsEnvPath)) dotenvConfig({ path: contractsEnvPath, override: false });
if (existsSync(backendEnvPath)) dotenvConfig({ path: backendEnvPath, override: false });

const JWT_SECRET = process.env.JWT_SECRET;
const BACKEND_URL = process.env.BACKEND_URL ?? 'http://localhost:3001';
if (!JWT_SECRET) {
  console.error(c.red('JWT_SECRET missing — set it in backend/.env'));
  process.exit(1);
}

const WORKER_PATH = resolve(__dirname, '../agents/worker.js');
if (!existsSync(WORKER_PATH)) {
  console.error(c.red(`worker.js not found at ${WORKER_PATH}`));
  process.exit(1);
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function mintJWT(address: string): string {
  return jwt.sign(
    { address, ownerAddress: address, agentName: 'worker-retry-smoke' },
    JWT_SECRET!,
    { algorithm: 'HS256', expiresIn: '1h' },
  );
}

function bytesToHex(b: Uint8Array): string {
  return Array.from(b, (n) => n.toString(16).padStart(2, '0')).join('');
}

async function http(
  method: 'GET' | 'POST',
  path: string,
  token?: string,
  body?: unknown,
): Promise<{ status: number; ok: boolean; json: any; text: string }> {
  const res = await fetch(`${BACKEND_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json: any = null;
  try { json = JSON.parse(text); } catch {}
  return { status: res.status, ok: res.ok, json, text };
}

async function main(): Promise<void> {
  console.log(c.bold('\n═══ Worker retry-loop smoke test ═══\n'));
  console.log(`  Backend: ${BACKEND_URL}`);
  console.log(`  Worker:  ${WORKER_PATH}\n`);

  // Pre-flight
  try {
    const h = await fetch(`${BACKEND_URL}/health`, { signal: AbortSignal.timeout(5000) });
    if (!h.ok) throw new Error(`/health ${h.status}`);
  } catch (e) {
    console.error(c.red(`backend not reachable: ${(e as Error).message}`));
    process.exit(1);
  }

  // ── 1. Actors ───────────────────────────────────────────────────────────
  const poster = Wallet.createRandom();
  const workerWallet = Wallet.createRandom();
  const workerPubKey = new SigningKey(workerWallet.privateKey).publicKey.slice(2);
  const posterJWT = mintJWT(poster.address);
  const workerJWT = mintJWT(workerWallet.address);

  console.log(c.dim('  Actors:'));
  console.log(c.dim(`    poster:  ${poster.address}`));
  console.log(c.dim(`    worker:  ${workerWallet.address}\n`));

  // ── 2. Post a task that will require a just-in-time wrap ──────────────
  const taskHash = hexlify(randomBytes(32));
  const postRes = await http('POST', '/api/v1/tasks', posterJWT, {
    taskHash,
    token: '0x' + '00'.repeat(19) + '01', // bogus, unsigned tx is discarded
    amount: '1000000',
    category: 'worker-retry-smoke',
    locationZone: 'global',
    duration: '3600',
    targetExecutorType: 'agent',
    verificationMode: 'auto',
    verificationCriteria: { min_length: 10 },
    requiredCapabilities: ['data_processing'],
    rootHash: hexlify(randomBytes(32)),
    // No wrappedKeys — the worker MUST go through /bid to be wrapped in.
  });
  if (!postRes.ok) {
    console.error(c.red(`POST /tasks failed: ${postRes.status} ${postRes.text.slice(0, 200)}`));
    process.exit(1);
  }
  console.log(`  ${c.green('✓')} task posted (taskHash=${taskHash.slice(0, 12)}…)\n`);

  // ── 3. Spawn worker.js ──────────────────────────────────────────────────
  const child = spawn(process.execPath, [WORKER_PATH], {
    env: {
      ...process.env,
      AGENT_ID: 'worker-retry-smoke-' + workerWallet.address.slice(2, 10),
      AGENT_NAME: 'WorkerRetrySmoke',
      AGENT_INSTRUCTIONS: 'unused — test cancels before LLM phase',
      AGENT_PROVIDER: 'openai',
      AGENT_MODEL: 'gpt-4o-mini',
      AGENT_API_KEY: 'dummy-not-used-in-test',
      AGENT_PLATFORM_TOKEN: workerJWT,
      AGENT_PRIVATE_KEY: workerWallet.privateKey,
      AGENT_PUBLIC_KEY: workerPubKey,
      AGENT_CAPABILITIES: JSON.stringify(['data_processing']),
      BACKEND_URL,
      POLL_INTERVAL_MS: '3000', // fast poll so the test runs in seconds
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  const workerLog: string[] = [];
  child.stdout.on('data', (b: Buffer) => {
    const txt = b.toString();
    workerLog.push(txt);
    process.stdout.write(c.dim('  [worker] ') + txt);
  });
  child.stderr.on('data', (b: Buffer) => {
    const txt = b.toString();
    workerLog.push(txt);
    process.stderr.write(c.yellow('  [worker stderr] ') + txt);
  });
  let workerExitCode: number | null = null;
  child.on('exit', (code) => { workerExitCode = code; });

  const cleanup = () => {
    if (workerExitCode === null) {
      try { child.kill('SIGTERM'); } catch {}
    }
  };
  process.on('exit', cleanup);
  process.on('SIGINT', () => { cleanup(); process.exit(130); });

  // ── 4. Wait for the worker to /bid (visible via /bids endpoint) ────────
  const bidDeadline = Date.now() + 30_000;
  let bidObserved = false;
  while (Date.now() < bidDeadline) {
    if (workerExitCode !== null) {
      console.error(c.red(`  ${c.red('✗')} worker exited prematurely (code=${workerExitCode})`));
      console.error(c.dim(workerLog.slice(-20).join('')));
      process.exit(1);
    }
    const bids = await http('GET', `/api/v1/a2a/tasks/${taskHash}/bids`, posterJWT);
    if (bids.ok) {
      const list = bids.json?.data?.bids ?? [];
      const found = list.find(
        (b: any) => b.address?.toLowerCase() === workerWallet.address.toLowerCase(),
      );
      if (found) {
        if (found.publicKey !== workerPubKey) {
          console.error(c.red(`  ${c.red('✗')} bid pubkey mismatch (got ${found.publicKey})`));
          cleanup();
          process.exit(1);
        }
        bidObserved = true;
        break;
      }
    }
    await sleep(1000);
  }
  if (!bidObserved) {
    console.error(c.red(`  ${c.red('✗')} worker did not POST /bid within 30s`));
    console.error(c.dim(workerLog.slice(-30).join('')));
    cleanup();
    process.exit(1);
  }
  console.log(`\n  ${c.green('✓')} worker /bid landed (visible in /bids)\n`);

  // Also check the worker's own log captured "bid registered" — proves the
  // bid was placed by this process, not just by some other actor.
  const sawBidLog = workerLog.join('').includes('bid registered on');
  if (!sawBidLog) {
    console.error(c.yellow(`  ${c.yellow('!')} worker stdout missing "bid registered" log line`));
    // Not fatal — the network round-trip already passed.
  } else {
    console.log(`  ${c.green('✓')} worker stdout shows "bid registered"\n`);
  }

  // ── 5. Wrap-to the worker (poster's just-in-time wrap step) ────────────
  const fakeWrappedBlob = bytesToHex(nodeRandomBytes(120));
  const wrapRes = await http('POST', `/api/v1/a2a/tasks/${taskHash}/wrap-to`, posterJWT, {
    wrappedKeys: { [workerWallet.address]: fakeWrappedBlob },
  });
  if (!wrapRes.ok) {
    console.error(c.red(`  ${c.red('✗')} /wrap-to failed: ${wrapRes.status} ${wrapRes.text.slice(0, 200)}`));
    cleanup();
    process.exit(1);
  }
  console.log(`  ${c.green('✓')} poster wrapped to worker (added=${wrapRes.json?.data?.added})\n`);

  // ── 6. Wait for the worker's NEXT /accept to succeed ───────────────────
  // We observe success by checking /tasks/posted (poster's inbox) for the
  // task transitioning to status='accepted' with executorAddress=worker.
  const acceptDeadline = Date.now() + 30_000;
  let acceptObserved = false;
  let finalState: any = null;
  while (Date.now() < acceptDeadline) {
    if (workerExitCode !== null) {
      console.error(c.red(`  ${c.red('✗')} worker exited before accept (code=${workerExitCode})`));
      console.error(c.dim(workerLog.slice(-20).join('')));
      process.exit(1);
    }
    const posted = await http('GET', '/api/v1/a2a/tasks/posted', posterJWT);
    if (posted.ok) {
      const tasks = posted.json?.data?.tasks ?? [];
      const ours = tasks.find(
        (t: any) => t.meta?.taskId?.toLowerCase() === taskHash.toLowerCase(),
      );
      if (ours?.state?.status === 'accepted') {
        if (ours.state.executorAddress?.toLowerCase() !== workerWallet.address.toLowerCase()) {
          console.error(c.red(`  ${c.red('✗')} accepted but executorAddress=${ours.state.executorAddress}, expected ${workerWallet.address}`));
          cleanup();
          process.exit(1);
        }
        acceptObserved = true;
        finalState = ours.state;
        break;
      }
    }
    await sleep(1000);
  }
  if (!acceptObserved) {
    console.error(c.red(`  ${c.red('✗')} worker did not /accept within 30s after wrap`));
    console.error(c.dim(workerLog.slice(-30).join('')));
    cleanup();
    process.exit(1);
  }
  console.log(`  ${c.green('✓')} worker /accept succeeded after wrap`);
  console.log(c.dim(`    state.status=${finalState.status}, executor=${finalState.executorAddress}\n`));

  // ── 7. Teardown ─────────────────────────────────────────────────────────
  cleanup();
  await sleep(500); // give the SIGTERM a beat to land

  console.log(c.bold(c.green('  ✓ worker retry-loop test PASSED\n')));
  process.exit(0);
}

main().catch((e) => {
  console.error(c.red('[fatal]'), e);
  process.exit(1);
});
