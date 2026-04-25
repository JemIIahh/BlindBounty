import { fork, type ChildProcess } from 'child_process';
import { randomUUID } from 'crypto';
import { fileURLToPath } from 'url';
import { join, dirname } from 'path';
import type { DeployedAgent, AgentCapability, AgentStatus, LLMProvider } from '../types.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const WORKER_PATH = join(__dirname, '../../agents/worker.js');

// In-memory store (swap for DB in prod)
const agents = new Map<string, DeployedAgent>();
const processes = new Map<string, ChildProcess>();

export function deployAgent(params: {
  ownerAddress: string;
  name: string;
  instructions: string;
  provider: LLMProvider;
  model: string;
  apiKey: string;
  capabilities: AgentCapability[];
  storageRef?: string;
}): DeployedAgent {
  const agent: DeployedAgent = {
    id: randomUUID(),
    status: 'stopped',
    deployedAt: new Date().toISOString(),
    ...params,
  };
  agents.set(agent.id, agent);
  return agent;
}

export function startAgent(id: string): void {
  const agent = agents.get(id);
  if (!agent) throw new Error(`Agent ${id} not found`);
  if (processes.has(id)) return; // already running

  const child = fork(WORKER_PATH, [], {
    env: {
      ...process.env,
      AGENT_ID: agent.id,
      AGENT_NAME: agent.name,
      AGENT_INSTRUCTIONS: agent.instructions,
      AGENT_PROVIDER: agent.provider,
      AGENT_MODEL: agent.model,
      AGENT_API_KEY: agent.apiKey,
    },
    // tsx can't fork .ts directly in prod; worker is compiled JS
    // In dev we rely on the compiled output or a separate tsx run
  });

  child.on('exit', () => {
    processes.delete(id);
    const a = agents.get(id);
    if (a && a.status === 'running') a.status = 'stopped';
  });

  processes.set(id, child);
  agent.status = 'running';
}

export function pauseAgent(id: string): void {
  const child = processes.get(id);
  if (!child) throw new Error(`Agent ${id} is not running`);
  child.kill('SIGSTOP');
  const agent = agents.get(id)!;
  agent.status = 'paused';
}

export function stopAgent(id: string): void {
  const child = processes.get(id);
  if (child) {
    child.kill('SIGTERM');
    processes.delete(id);
  }
  const agent = agents.get(id);
  if (agent) agent.status = 'stopped';
}

export function getAgent(id: string): DeployedAgent | undefined {
  return agents.get(id);
}

export function listAgents(ownerAddress?: string): DeployedAgent[] {
  const all = Array.from(agents.values());
  return ownerAddress ? all.filter((a) => a.ownerAddress === ownerAddress) : all;
}
