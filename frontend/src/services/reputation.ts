import { get } from '../lib/api';

export interface DecayedReputation {
  address: string;
  tasksCompleted: number;
  avgScore: number;
  disputes: number;
  rawScore: number;
  decayedScore: number;
  decayFactor: number;
  daysSinceLastTask: number | null;
  offChainTasksCompleted: number;
  offChainDisputes: number;
}

export interface ReputationEvent {
  id: number;
  address: string;
  task_id: string;
  event_type: string;
  score_delta: number;
  created_at: string;
}

export interface LeaderboardEntry {
  address: string;
  rawScore: number;
  decayedScore: number;
  decayFactor: number;
  daysSinceLastTask: number | null;
  tasksCompleted: number;
  disputes: number;
}

export async function getReputation(address: string): Promise<DecayedReputation> {
  return get<DecayedReputation>(`/api/v1/reputation/${address}`);
}

export async function getLeaderboard(limit?: number): Promise<{ leaderboard: LeaderboardEntry[] }> {
  const qs = limit ? `?limit=${limit}` : '';
  return get<{ leaderboard: LeaderboardEntry[] }>(`/api/v1/reputation/leaderboard${qs}`);
}

export async function getReputationHistory(address: string): Promise<{ history: ReputationEvent[] }> {
  return get<{ history: ReputationEvent[] }>(`/api/v1/reputation/${address}/history`);
}
