import { Link } from 'react-router-dom';
import { useWallet } from '../../context/WalletContext';
import { LogoMark } from './LogoMark';
import { Button } from './Button';

export function TopBar() {
  const { address, connect, disconnect, connecting } = useWallet();

  const toggleTheme = () => {
    const current = document.documentElement.getAttribute('data-theme') || 'dark';
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('bb.theme', next);
  };

  const currentTheme = typeof document !== 'undefined'
    ? document.documentElement.getAttribute('data-theme') || 'dark'
    : 'dark';

  return (
    <header className="h-16 border-b border-line bg-surface flex items-center px-6 gap-4">
      {/* Logo — left */}
      <Link to="/" className="flex items-center gap-2 mr-4">
        <LogoMark size={22} blade="var(--bb-cream)" slit="var(--bb-surface)" />
        <span className="text-sm font-mono font-bold text-ink uppercase tracking-wider">blindbounty</span>
      </Link>

      {/* Primary nav — center/left */}
      <div className="flex-1 flex items-center gap-1 text-xs font-mono">
        <Link
          to="/tasks"
          className="px-3 py-2 text-ink-3 hover:text-ink-2 border border-transparent hover:border-line transition-colors"
        >
          tasks
        </Link>
        <Link
          to="/worker"
          className="px-3 py-2 text-ink-3 hover:text-ink-2 border border-transparent hover:border-line transition-colors"
        >
          worker
        </Link>
        <Link
          to="/verification"
          className="px-3 py-2 text-ink-3 hover:text-ink-2 border border-transparent hover:border-line transition-colors"
        >
          verification
        </Link>
      </div>

      {/* Post task */}
      <Link to="/agent">
        <Button variant="outline" label="post_task" size="sm" />
      </Link>

      {/* Theme toggle */}
      <button
        onClick={toggleTheme}
        className="flex items-center border border-line text-xs font-mono"
      >
        <span className={`px-3 py-2 ${currentTheme === 'light' ? 'text-ink' : 'text-ink-3'}`}>
          ◌ light
        </span>
        <span className={`px-3 py-2 border-l border-line ${currentTheme === 'dark' ? 'text-ink' : 'text-ink-3'}`}>
          ● dark
        </span>
      </button>

      {/* Wallet — right */}
      {address ? (
        <button
          onClick={disconnect}
          className="flex items-center gap-2 px-3 py-2 border border-line text-xs font-mono text-ink-2 hover:border-line-2 transition-colors"
        >
          <span className="w-1.5 h-1.5 bg-ok inline-block" />
          <span>{address.slice(0, 6)}…{address.slice(-4)}</span>
        </button>
      ) : (
        <Button
          variant="outline"
          label={connecting ? 'connecting…' : 'connect_wallet'}
          size="sm"
          onClick={connect}
          disabled={connecting}
        />
      )}
    </header>
  );
}
