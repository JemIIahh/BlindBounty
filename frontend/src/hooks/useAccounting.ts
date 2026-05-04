import { useQuery } from '@tanstack/react-query';
import { getEntries, getSummary } from '../services/accounting';
import { useAuth } from '../context/AuthContext';

export function useAccountingEntries(from?: string, to?: string, type?: string) {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: ['accounting-entries', from, to, type],
    queryFn: () => getEntries(from, to, type),
    // Don't fire until the user is authenticated — prevents 401s before Privy
    // has finished its auth flow and wired the access token getter.
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
