import { createContext, useContext, useEffect, useRef, type ReactNode } from 'react';
import { usePrivy, getIdentityToken, getAccessToken } from '@privy-io/react-auth';
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

// Module-scope token cache. Privy's getIdentityToken() can trigger a
// /users/me roundtrip if it thinks the cached token is stale, and the SDK's
// internal dedup is unreliable in v3.23.1 — calling it on every backend
// request (api.ts:36 invokes _getAccessToken per authedGet/authedPost) had
// us hitting Privy's 429 in production. Caching the JWT until ~60s before
// its own `exp` claim collapses that to one Privy call per ~hour per user.
let cachedToken: string | null = null;
let cachedExp = 0;

export function AuthProvider({ children }: { children: ReactNode }) {
  const { ready, authenticated, login, logout } = usePrivy();
  const { address } = useAccount();
  const trackedRef = useRef(false);

  // Wire Privy's identity token into api.ts so authedGet/authedPost
  // automatically attach Authorization: Bearer <privy-id-token>.
  // Identity tokens contain the linked_accounts claim needed for backend wallet extraction.
  useEffect(() => {
    // Reset cache on every auth state flip — handles logout/login of a
    // different wallet without stale-token bleed.
    cachedToken = null;
    cachedExp = 0;

    if (authenticated) {
      setAccessTokenGetter(async () => {
        const now = Math.floor(Date.now() / 1000);
        if (cachedToken && cachedExp - now > 60) {
          return cachedToken;
        }
        try {
          const tok = (await getIdentityToken()) || (await getAccessToken());
          if (tok) {
            try {
              const claims = JSON.parse(atob(tok.split('.')[1]));
              cachedExp = typeof claims.exp === 'number' ? claims.exp : 0;
            } catch {
              cachedExp = 0;
            }
            cachedToken = tok;
          }
          return tok;
        } catch (err) {
          console.error('[Auth] Failed to get tokens:', err);
          return null;
        }
      });
    } else {
      setAccessTokenGetter(null);
      trackedRef.current = false;
    }
  }, [authenticated]);

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
