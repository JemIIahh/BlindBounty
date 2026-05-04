import { createContext, useContext, useEffect, useRef, type ReactNode } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useAccount } from 'wagmi';
import { setAccessTokenGetter } from '../lib/api';
import { trackEvent } from '../hooks/useAnalytics';

interface AuthState {
  isAuthenticated: boolean;
  authenticating: boolean;
  login: () => void;
  logout: () => Promise<void> | void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { ready, authenticated, login, logout, getAccessToken } = usePrivy();
  const { address } = useAccount();
  const trackedRef = useRef(false);

  // Wire Privy's access token into api.ts so authedGet/authedPost
  // automatically attach Authorization: Bearer <privy-jwt>.
  useEffect(() => {
    if (authenticated) {
      setAccessTokenGetter(async () => {
        try {
          return await getAccessToken();
        } catch {
          return null;
        }
      });
    } else {
      setAccessTokenGetter(null);
      trackedRef.current = false;
    }
  }, [authenticated, getAccessToken]);

  // Fire analytics event the first time the user authenticates this session.
  useEffect(() => {
    if (authenticated && !trackedRef.current) {
      trackedRef.current = true;
      trackEvent('connect_wallet', address ? { address: address.toLowerCase() } : undefined);
    }
  }, [authenticated, address]);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: authenticated,
        authenticating: !ready,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
