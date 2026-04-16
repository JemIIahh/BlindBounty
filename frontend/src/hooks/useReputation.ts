import { useQuery } from '@tanstack/react-query';
import { getReputation } from '../services/reputation';

export function useReputation(address: string | null) {
  return useQuery({
    queryKey: ['reputation', address],
    queryFn: () => getReputation(address!),
    enabled: !!address,
  });
}
