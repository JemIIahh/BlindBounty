import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { useWallet } from './WalletContext';
import { postNonce, postVerify } from '../services/auth';

interface AuthState {
  jwt: string | null;
  isAuthenticated: boolean;
  authenticating: boolean;
  login: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { address, signer } = useWallet();
  const [jwt, setJwt] = useState<string | null>(() => localStorage.getItem('bb_jwt'));
  const [authenticating, setAuthenticating] = useState(false);

  const isAuthenticated = !!jwt && !!address;

  const logout = useCallback(() => {
    setJwt(null);
    localStorage.removeItem('bb_jwt');
  }, []);

  // Clear JWT if address changes
  useEffect(() => {
    if (!address) {
      logout();
    }
  }, [address, logout]);

  const login = useCallback(async () => {
    if (!address || !signer) return;
    setAuthenticating(true);
    try {
      // Step 1: Get nonce
      const { nonce } = await postNonce(address);

      // Step 2: Sign the message (must match backend format exactly)
      const message = `Sign this message to authenticate with BlindBounty.\n\nNonce: ${nonce}`;
      const signature = await signer.signMessage(message);

      // Step 3: Verify and get JWT
      const { token } = await postVerify(address, signature);

      localStorage.setItem('bb_jwt', token);
      setJwt(token);
    } finally {
      setAuthenticating(false);
    }
  }, [address, signer]);

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
