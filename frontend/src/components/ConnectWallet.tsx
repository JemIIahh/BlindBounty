import { useWallet } from '../context/WalletContext';
import { useAuth } from '../context/AuthContext';
import { truncateAddress } from '../lib/utils';

export function ConnectWallet() {
  const { address, connecting, connect, disconnect, isCorrectChain, switchChain } = useWallet();
  const { isAuthenticated, authenticating, login } = useAuth();

  if (!address) {
    return (
      <button
        className="px-4 py-1.5 rounded-lg bg-white text-neutral-950 text-xs font-semibold hover:bg-neutral-100 transition-colors disabled:opacity-50"
        onClick={connect}
        disabled={connecting}
      >
        {connecting ? 'Connecting...' : 'Connect Wallet'}
      </button>
    );
  }

  if (!isCorrectChain) {
    return (
      <button
        className="px-4 py-1.5 rounded-lg border border-neutral-600 text-neutral-300 text-xs font-semibold hover:border-white hover:text-white transition-colors"
        onClick={switchChain}
      >
        Switch to 0G
      </button>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-neutral-400 font-mono">{truncateAddress(address)}</span>
        <button
          className="px-4 py-1.5 rounded-lg bg-white text-neutral-950 text-xs font-semibold hover:bg-neutral-100 transition-colors disabled:opacity-50"
          onClick={login}
          disabled={authenticating}
        >
          {authenticating ? 'Signing...' : 'Sign In'}
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-neutral-700">
        <span className="w-1.5 h-1.5 rounded-full bg-white" />
        <span className="text-xs text-neutral-300 font-mono">{truncateAddress(address)}</span>
      </div>
      <button
        className="px-3 py-1.5 rounded text-xs text-neutral-500 hover:text-white transition-colors"
        onClick={disconnect}
      >
        Disconnect
      </button>
    </div>
  );
}
