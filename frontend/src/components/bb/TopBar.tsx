import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { LogoMark } from './LogoMark';
import { Button } from './Button';

export function TopBar() {
  const [copied, setCopied] = useState(false);
  const [currentTheme, setCurrentTheme] = useState('light');

  // Initialize theme on component mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('bb.theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    setCurrentTheme(savedTheme);
  }, []);

  const copyAddress = async () => {
    if (!address) return;
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      // clipboard blocked (iframe, insecure context) — silently ignore
    }
  };

  const toggleTheme = () => {
    const current = document.documentElement.getAttribute('data-theme') || 'light';
    const next = current === 'light' ? 'dark' : 'light';
    console.log('Theme toggle:', current, '->', next);
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('bb.theme', next);
    setCurrentTheme(next);
  };

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
          {currentTheme === 'light' ? '●' : '◌'} light
        </span>
        <span className={`px-3 py-2 border-l border-line ${currentTheme === 'dark' ? 'text-ink' : 'text-ink-3'}`}>
          {currentTheme === 'dark' ? '●' : '◌'} dark
        </span>
      </button>

      {/* Wallet — right */}
      <ConnectButton />
    </header>
  );
}
