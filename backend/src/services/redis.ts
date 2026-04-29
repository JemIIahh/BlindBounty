import { Redis } from 'ioredis';
import type { DeployedAgent } from '../types.js';

const REDIS_URL = process.env.REDIS_URL ?? 'redis://localhost:6379';

export const redis = new Redis(REDIS_URL, { lazyConnect: true, maxRetriesPerRequest: 3 });
export const redisSub = new Redis(REDIS_URL, { lazyConnect: true, maxRetriesPerRequest: 3 });

redis.on('error', (e: Error) => console.error('[redis] client error:', e.message));
redisSub.on('error', (e: Error) => console.error('[redis] sub error:', e.message));

// ── Keys ─────────────────────────────────────────────────────────────────────

const KEY = {
  agent: (id: string) => `agent:${id}`,
  agentIds: () => 'agents:ids',
  agentLogs: (id: string) => `agent:${id}:logs`,
  agentLogChannel: (id: string) => `agent:${id}:log-stream`,
  agentHeartbeat: (id: string) => `agent:${id}:heartbeat`,
};

const HEARTBEAT_TTL_S = 90; // agent considered dead if no heartbeat for 90s
const LOG_LIMIT = 200;

// ── Agent state ───────────────────────────────────────────────────────────────

export async function saveAgent(agent: DeployedAgent): Promise<void> {
  const pipe = redis.pipeline();
  pipe.set(KEY.agent(agent.id), JSON.stringify(agent));
  pipe.sadd(KEY.agentIds(), agent.id);
  await pipe.exec();
}

export async function loadAgent(id: string): Promise<DeployedAgent | null> {
  const raw = await redis.get(KEY.agent(id));
  return raw ? (JSON.parse(raw) as DeployedAgent) : null;
}

export async function loadAllAgents(): Promise<DeployedAgent[]> {
  const ids = await redis.smembers(KEY.agentIds());
  if (!ids.length) return [];
  const raws = await redis.mget(...ids.map(KEY.agent));
  return raws.filter(Boolean).map(r => JSON.parse(r as string) as DeployedAgent);
}

// ── Logs ──────────────────────────────────────────────────────────────────────

export async function appendLog(id: string, line: string): Promise<void> {
  const pipe = redis.pipeline();
  pipe.rpush(KEY.agentLogs(id), line);
  pipe.ltrim(KEY.agentLogs(id), -LOG_LIMIT, -1);
  await pipe.exec();
  // Publish to channel for live SSE subscribers
  await redis.publish(KEY.agentLogChannel(id), line);
}

export async function getLogs(id: string): Promise<string[]> {
  return redis.lrange(KEY.agentLogs(id), 0, -1);
}

/**
 * Subscribe to live log lines for an agent.
 * Returns an unsubscribe function.
 */
export async function subscribeAgentLogs(
  id: string,
  cb: (line: string) => void,
): Promise<() => void> {
  const channel = KEY.agentLogChannel(id);
  await redisSub.subscribe(channel);
  const handler = (chan: string, message: string) => {
    if (chan === channel) cb(message);
  };
  redisSub.on('message', handler);
  return async () => {
    redisSub.off('message', handler);
    await redisSub.unsubscribe(channel);
  };
}

// ── Heartbeat ─────────────────────────────────────────────────────────────────

export async function touchHeartbeat(id: string): Promise<void> {
  await redis.set(KEY.agentHeartbeat(id), Date.now(), 'EX', HEARTBEAT_TTL_S);
}

export async function isAlive(id: string): Promise<boolean> {
  return (await redis.exists(KEY.agentHeartbeat(id))) === 1;
}
