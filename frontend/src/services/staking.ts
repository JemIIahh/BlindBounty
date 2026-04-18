import { authedPost, get } from '../lib/api';

export interface Stake {
  id: number;
  worker: string;
  task_id: string;
  task_reward: number;
  stake_amount: number;
  status: 'locked' | 'returned' | 'slashed';
  created_at: string;
  updated_at: string;
}

export interface StakeSummary {
  totalLocked: number;
  totalReturned: number;
  totalSlashed: number;
  activeStakes: number;
}

export async function lockStake(taskId: string, taskReward: number) {
  return authedPost<Stake>('/api/v1/staking/stake', { taskId, taskReward });
}

export async function releaseStake(taskId: string) {
  return authedPost<Stake>('/api/v1/staking/release', { taskId });
}

export async function slashStake(taskId: string) {
  return authedPost<Stake>('/api/v1/staking/slash', { taskId });
}

export async function getWorkerStakes(address: string) {
  return get<{ stakes: Stake[]; summary: StakeSummary }>(`/api/v1/staking/${address}`);
}
