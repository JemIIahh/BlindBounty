import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { ethers } from 'ethers';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { OG_CHAIN_CONFIG, OG_CHAIN_ID } from '../config/constants';

const HAS_PRIVY = !!import.meta.env.VITE_PRIVY_APP_ID;

interface WalletState {
  address: string | null;
  provider: ethers.BrowserProvider | null;
  signer: ethers.JsonRpcSigner | null;
  chainId: number | null;
  connecting: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  switchChain: () => Promise<void>;
  isCorrectChain: boolean;
}

const WalletContext = createContext<WalletState | null>(null);

/* ── Privy-based provider ───────────────────────────────────────── */
function PrivyWalletProvider({ children }: { children: ReactNode }) {
  const { login, logout: privyLogout, authenticated, ready } = usePrivy();
  const { wallets } = useWallets();
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [connecting, setConnecting] = useState(false);

  const wallet = wallets[0] ?? null;
  const address = wallet?.address ?? null;
  const isCorrectChain = chainId === OG_CHAIN_ID;

  useEffect(() => {
    let cancelled = false;
    async function sync() {
      if (!wallet) { setProvider(null); setSigner(null); setChainId(null); return; }
      try {
        const ethereumProvider = await wallet.getEthereumProvider();
        const bp = new ethers.BrowserProvider(ethereumProvider);
        const s = await bp.getSigner();
        const network = await bp.getNetwork();
        if (!cancelled) { setProvider(bp); setSigner(s); setChainId(Number(network.chainId)); }
      } catch (err) { console.error('Failed to sync wallet provider:', err); }
    }
    sync();
    return () => { cancelled = true; };
  }, [wallet, wallet?.chainId]);

  const switchChain = useCallback(async () => {
    if (!wallet) return;
    try { await wallet.switchChain(OG_CHAIN_ID); } catch (err) { console.error('Failed to switch chain:', err); }
  }, [wallet]);

  const connect = useCallback(async () => {
    if (authenticated) return;
    setConnecting(true);
    try { login(); } finally { setConnecting(false); }
  }, [authenticated, login]);

  const disconnect = useCallback(() => {
    privyLogout();
    setProvider(null); setSigner(null); setChainId(null);
  }, [privyLogout]);

  return (
    <WalletContext.Provider value={{ address, provider, signer, chainId, connecting: connecting || !ready, connect, disconnect, switchChain, isCorrectChain }}>
      {children}
    </WalletContext.Provider>
  );
}

/* ── Direct MetaMask provider (no Privy) ────────────────────────── */
function DirectWalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [connecting, setConnecting] = useState(false);

  const isCorrectChain = chainId === OG_CHAIN_ID;

  const switchChain = useCallback(async () => {
    const eth = window.ethereum;
    if (!eth) return;
    try {
      await eth.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: OG_CHAIN_CONFIG.chainId }] });
    } catch (err: unknown) {
      const code = (err as { code?: number }).code;
      if (code === 4902) {
        try { await eth.request({ method: 'wallet_addEthereumChain', params: [OG_CHAIN_CONFIG] }); }
        catch (addErr) { console.error('Failed to add 0G chain:', addErr); }
      } else { console.error('Failed to switch chain:', err); }
    }
  }, []);

  const connect = useCallback(async () => {
    const eth = window.ethereum;
    if (!eth) { alert('No wallet detected. Please install MetaMask or another EVM wallet.'); return; }
    setConnecting(true);
    try {
      const bp = new ethers.BrowserProvider(eth);
      await bp.send('eth_requestAccounts', []);
      const s = await bp.getSigner();
      const addr = await s.getAddress();
      const network = await bp.getNetwork();
      setProvider(bp); setSigner(s); setAddress(addr); setChainId(Number(network.chainId));
      if (Number(network.chainId) !== OG_CHAIN_ID) await switchChain();
    } catch (err: unknown) {
      const code = (err as { code?: string | number }).code;
      if (code !== 4001 && code !== 'ACTION_REJECTED') {
        console.error('Wallet connection failed:', err);
        alert('Wallet connection failed. Check the console for details.');
      }
    } finally { setConnecting(false); }
  }, [switchChain]);

  const disconnect = useCallback(() => {
    setAddress(null); setProvider(null); setSigner(null); setChainId(null);
    localStorage.removeItem('bb_jwt');
  }, []);

  useEffect(() => {
    const eth = window.ethereum;
    if (!eth) return;
    const onAccounts = (accounts: string[]) => { if (accounts.length === 0) disconnect(); else { setAddress(accounts[0]); localStorage.removeItem('bb_jwt'); } };
    const onChain = (cid: string) => setChainId(Number(cid));
    eth.on('accountsChanged', onAccounts);
    eth.on('chainChanged', onChain);
    return () => { eth?.removeListener('accountsChanged', onAccounts); eth?.removeListener('chainChanged', onChain); };
  }, [disconnect]);

  return (
    <WalletContext.Provider value={{ address, provider, signer, chainId, connecting, connect, disconnect, switchChain, isCorrectChain }}>
      {children}
    </WalletContext.Provider>
  );
}

/* ── Export: pick provider based on config ───────────────────────── */
export function WalletProvider({ children }: { children: ReactNode }) {
  if (HAS_PRIVY) return <PrivyWalletProvider>{children}</PrivyWalletProvider>;
  return <DirectWalletProvider>{children}</DirectWalletProvider>;
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error('useWallet must be used within WalletProvider');
  return ctx;
}

// Window.ethereum type — skip if already declared by Privy or another lib
declare global {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface Window {
    ethereum?: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  }
}
