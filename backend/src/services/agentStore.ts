import type { AgentExecutor, AgentCapability } from '../types.js';

const MAX_AGENTS = 1_000;
const agents = new Map<string, AgentExecutor>();

export function registerAgent(agent: AgentExecutor): void {
  if (agents.size >= MAX_AGENTS && !agents.has(agent.address)) {
    throw new Error('Agent registry full');
  }
  agents.set(agent.address, agent);
}

export function getAgent(address: string): AgentExecutor | undefined {
  return agents.get(address);
}

export function getAllAgents(): AgentExecutor[] {
  return Array.from(agents.values());
}

export function findByCapabilities(
  required: AgentCapability[],
  minReputation = 0,
): AgentExecutor[] {
  return Array.from(agents.values()).filter((a) => {
    if (a.reputation < minReputation) return false;
    return required.every((cap) => a.capabilities.includes(cap));
  });
}
