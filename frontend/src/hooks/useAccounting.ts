import { useQuery } from '@tanstack/react-query';
import { getEntries, getSummary } from '../services/accounting';
import { useAuth } from '../context/AuthContext';

export function useAccountingEntries(from?: string, to?: string, type?: string, page: number = 1, pageSize: number = 20) {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: ['accounting-entries', from, to, type, page, pageSize],
    queryFn: () => getEntries(from, to, type, page, pageSize),
    enabled: isAuthenticated,
  });
}

export function useAccountingSummary(from?: string, to?: string) {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: ['accounting-summary', from, to],
    queryFn: () => getSummary(from, to),
    enabled: isAuthenticated,
  });
}
