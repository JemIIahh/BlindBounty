import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { ethers } from 'ethers';
import { OG_CHAIN_CONFIG, OG_CHAIN_ID } from '../config/constants';

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

export function WalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [connecting, setConnecting] = useState(false);

  const isCorrectChain = chainId === OG_CHAIN_ID;

  const switchChain = useCallback(async () => {
    if (!window.ethereum) return;
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: OG_CHAIN_CONFIG.chainId }],
      });
    } catch (err: unknown) {
      if ((err as { code: number }).code === 4902) {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [OG_CHAIN_CONFIG],
        });
      }
    }
  }, []);

  const connect = useCallback(async () => {
    if (!window.ethereum) {
      alert('MetaMask not detected');
      return;
    }
    setConnecting(true);
    try {
      const bp = new ethers.BrowserProvider(window.ethereum);
      await bp.send('eth_requestAccounts', []);
      const s = await bp.getSigner();
      const addr = await s.getAddress();
      const network = await bp.getNetwork();

      setProvider(bp);
      setSigner(s);
      setAddress(addr);
      setChainId(Number(network.chainId));

      if (Number(network.chainId) !== OG_CHAIN_ID) {
        await switchChain();
      }
    } finally {
      setConnecting(false);
    }
  }, [switchChain]);

  const disconnect = useCallback(() => {
    setAddress(null);
    setProvider(null);
    setSigner(null);
    setChainId(null);
    localStorage.removeItem('bb_jwt');
  }, []);

  // Listen for account/chain changes
  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnect();
      } else {
        setAddress(accounts[0]);
        localStorage.removeItem('bb_jwt');
      }
    };

    const handleChainChanged = (cid: string) => {
      setChainId(Number(cid));
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    return () => {
      window.ethereum?.removeListener('accountsChanged', handleAccountsChanged);
      window.ethereum?.removeListener('chainChanged', handleChainChanged);
    };
  }, [disconnect]);

  return (
    <WalletContext.Provider
      value={{ address, provider, signer, chainId, connecting, connect, disconnect, switchChain, isCorrectChain }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error('useWallet must be used within WalletProvider');
  return ctx;
}

// MetaMask window type
declare global {
  interface Window {
    ethereum?: ethers.Eip1193Provider & {
      on: (event: string, handler: (...args: never[]) => void) => void;
      removeListener: (event: string, handler: (...args: never[]) => void) => void;
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
    };
  }
}
