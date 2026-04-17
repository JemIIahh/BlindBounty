import type { A2ATaskMeta, A2ATaskState, AgentCapability } from '../types.js';
import { findByCapabilities } from './agentStore.js';

const taskMetas = new Map<string, A2ATaskMeta>();
const taskStates = new Map<string, A2ATaskState>();

export function setMeta(meta: A2ATaskMeta): void {
  taskMetas.set(meta.taskId, meta);
  // Initialize state if not present
  if (!taskStates.has(meta.taskId)) {
    taskStates.set(meta.taskId, {
      taskId: meta.taskId,
      status: 'open',
    });
  }
}

export function getMeta(taskId: string): A2ATaskMeta | undefined {
  return taskMetas.get(taskId);
}

export function getState(taskId: string): A2ATaskState | undefined {
  return taskStates.get(taskId);
}

export function updateState(taskId: string, patch: Partial<A2ATaskState>): A2ATaskState {
  const existing = taskStates.get(taskId);
  if (!existing) throw new Error(`No A2A state for task ${taskId}`);
  const updated = { ...existing, ...patch, taskId };
  taskStates.set(taskId, updated);
  return updated;
}

/** Browse tasks that match agent capabilities + reputation */
export function browseAgentTasks(
  capabilities?: AgentCapability[],
  minReputation?: number,
): Array<{ meta: A2ATaskMeta; state: A2ATaskState }> {
  const results: Array<{ meta: A2ATaskMeta; state: A2ATaskState }> = [];
  for (const [taskId, meta] of taskMetas) {
    if (meta.targetExecutorType !== 'agent') continue;
    const state = taskStates.get(taskId);
    if (!state || state.status !== 'open') continue;

    // If caller supplied capabilities, check match
    if (capabilities && capabilities.length > 0) {
      const overlap = meta.requiredCapabilities.filter((c) => capabilities.includes(c));
      if (overlap.length === 0 && meta.requiredCapabilities.length > 0) continue;
    }

    results.push({ meta, state });
  }
  return results;
}

/** Get all tasks accepted by a specific executor */
export function getExecutorTasks(address: string): Array<{ meta: A2ATaskMeta; state: A2ATaskState }> {
  const results: Array<{ meta: A2ATaskMeta; state: A2ATaskState }> = [];
  for (const [taskId, state] of taskStates) {
    if (state.executorAddress !== address) continue;
    const meta = taskMetas.get(taskId);
    if (meta) results.push({ meta, state });
  }
  return results;
}
