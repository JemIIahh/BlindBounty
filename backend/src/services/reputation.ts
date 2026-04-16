import { reputation } from './chain.js';
import type { Reputation } from '../types.js';

/** Get reputation for a worker address */
export async function getReputation(worker: string): Promise<Reputation> {
  const [tasksCompleted, totalScore, disputes] = await reputation.getReputation(worker);
  return {
    tasksCompleted: tasksCompleted as bigint,
    totalScore: totalScore as bigint,
    disputes: disputes as bigint,
  };
}

/** Check if a worker has been rated for a specific task */
export async function hasBeenRated(worker: string, taskId: number): Promise<boolean> {
  return await reputation.hasBeenRated(worker, taskId) as boolean;
}
