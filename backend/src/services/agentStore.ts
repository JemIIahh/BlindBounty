import { redis } from './redis.js';
import type { AgentExecutor } from '../types.js';

// ── Keys ─────────────────────────────────────────────────────────────────────
//
// Persistence model — mirrors a2aStore's pattern so cold restarts don't wipe
// state. Previously this was an in-memory Map; that meant every backend
// restart wiped all A2A executor registrations, leaving worker.js processes
// silently 403'd by /accept (NOT_REGISTERED) until each one restarted and
// re-registered. With Redis-backed storage, registrations survive bounces.
//
//   agent:executor:<lowercased_addr>  → JSON of AgentExecutor
//   agent:executor:all                → SET of lowercased addresses (size-cap check)
//
// Addresses are always lowercased for keys to defang case mismatches between
// EIP-55 checksummed and lowercased forms.

const KEY = {
  executor: (addr: string) => `agent:executor:${addr.toLowerCase()}`,
  all: 'agent:executor:all',
};

const MAX_AGENTS = 1_000;

export async function registerAgent(agent: AgentExecutor): Promise<void> {
  const addr = agent.address.toLowerCase();
  // Check size cap only for NEW registrations — re-registers (worker.js calls
  // this on every startup) shouldn't be blocked by the cap even at scale.
  const exists = await redis.exists(KEY.executor(addr));
  if (!exists) {
    const total = await redis.scard(KEY.all);
    if (total >= MAX_AGENTS) {
      throw new Error('Agent registry full');
    }
  }
  const pipe = redis.pipeline();
  pipe.set(KEY.executor(addr), JSON.stringify(agent));
  pipe.sadd(KEY.all, addr);
  await pipe.exec();
}

export async function getAgent(address: string): Promise<AgentExecutor | undefined> {
  const raw = await redis.get(KEY.executor(address));
  return raw ? (JSON.parse(raw) as AgentExecutor) : undefined;
}
