import { registry } from './chain.js';
import type { TaskMeta } from '../types.js';

/** Get open tasks with pagination from TaskRegistry */
export async function getOpenTasks(offset: number, limit: number): Promise<TaskMeta[]> {
  const raw = await registry.getOpenTasks(offset, limit);
  return (raw as Array<{
    taskId: bigint;
    agent: string;
    category: string;
    locationZone: string;
    reward: bigint;
    createdAt: bigint;
    isOpen: boolean;
  }>).map((t) => ({
    taskId: t.taskId,
    agent: t.agent,
    category: t.category,
    locationZone: t.locationZone,
    reward: t.reward,
    createdAt: t.createdAt,
    isOpen: t.isOpen,
  }));
}

/** Get metadata for a specific task */
export async function getTaskMeta(taskId: number): Promise<TaskMeta> {
  const t = await registry.getTaskMeta(taskId);
  return {
    taskId: t.taskId,
    agent: t.agent,
    category: t.category,
    locationZone: t.locationZone,
    reward: t.reward,
    createdAt: t.createdAt,
    isOpen: t.isOpen,
  };
}

/** Get total number of published tasks */
export async function totalTasks(): Promise<number> {
  return Number(await registry.totalTasks());
}

/** Get count of open tasks */
export async function openTaskCount(): Promise<number> {
  return Number(await registry.openTaskCount());
}
