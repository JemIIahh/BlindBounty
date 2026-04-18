import { useQuery } from '@tanstack/react-query';
import { getReputation, getLeaderboard, getReputationHistory } from '../services/reputation';

export function useReputation(address: string | null) {
  return useQuery({
    queryKey: ['reputation', address],
    queryFn: () => getReputation(address!),
    enabled: !!address,
  });
}

export function useLeaderboard(limit?: number) {
  return useQuery({
    queryKey: ['leaderboard', limit],
    queryFn: () => getLeaderboard(limit),
  });
}

export function useReputationHistory(address: string | null) {
  return useQuery({
    queryKey: ['reputation-history', address],
    queryFn: () => getReputationHistory(address!),
    enabled: !!address,
  });
}
