import { get } from '../lib/api';
import type { Reputation } from '../types/api';

export async function getReputation(address: string): Promise<Reputation> {
  return get<Reputation>(`/api/v1/reputation/${address}`);
}

export interface LeaderboardEntry {
  address: string;
  tasksCompleted: string;
  totalScore: string;
}

export async function getLeaderboard(): Promise<LeaderboardEntry[]> {
  return get<LeaderboardEntry[]>('/api/v1/reputation/leaderboard');
}
