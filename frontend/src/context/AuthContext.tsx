import { createContext, useContext, useEffect, useCallback, type ReactNode } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useWallet } from './WalletContext';
import { setAccessTokenGetter } from '../lib/api';

interface AuthState {
  jwt: string | null;
  isAuthenticated: boolean;
  authenticating: boolean;
  login: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { login: privyLogin, logout: privyLogout, authenticated, ready, getAccessToken } = usePrivy();
  const { address } = useWallet();

  const isAuthenticated = authenticated && !!address;
  const authenticating = !ready;

  // Wire up api.ts to use Privy's access token
  useEffect(() => {
    if (authenticated) {
      setAccessTokenGetter(getAccessToken);
    } else {
      setAccessTokenGetter(null);
    }
  }, [authenticated, getAccessToken]);

  const login = useCallback(async () => {
    privyLogin();
  }, [privyLogin]);

  const logout = useCallback(() => {
    privyLogout();
  }, [privyLogout]);

  // Expose a synchronous jwt value for consumers that check it directly
  // For API calls, the getter in api.ts handles async token retrieval
  const jwt = isAuthenticated ? 'privy-managed' : null;

  return (
    <AuthContext.Provider value={{ jwt, isAuthenticated, authenticating, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
