import { useQuery } from '@tanstack/react-query';
import { getEntries, getSummary } from '../services/accounting';

export function useAccountingEntries(from?: string, to?: string, type?: string) {
  return useQuery({
    queryKey: ['accounting-entries', from, to, type],
    queryFn: () => getEntries(from, to, type),
  });
}

export function useAccountingSummary(from?: string, to?: string) {
  return useQuery({
    queryKey: ['accounting-summary', from, to],
    queryFn: () => getSummary(from, to),
  });
}
