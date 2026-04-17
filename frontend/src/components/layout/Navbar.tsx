import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ConnectWallet } from '../ConnectWallet';
import { cn } from '../../lib/utils';

const navLinks = [
  { to: '/how-it-works', label: 'HOW IT WORKS', icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
  { to: '/tasks', label: 'TASKS', icon: 'M4 6h16M4 10h16M4 14h16M4 18h16' },
  { to: '/agent', label: 'AGENT', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
  { to: '/worker', label: 'WORKER', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
  { to: '/a2a', label: 'A2A', icon: 'M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
];

export function Navbar() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="bg-[#0d0d0d]/80 backdrop-blur-xl border-b border-neutral-800/50 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center">
              <svg className="w-4 h-4 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <span className="text-lg font-semibold text-white">BlindBounty</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden sm:flex items-center gap-1">
            {navLinks.map(({ to, label, icon }, i) => (
              <div key={to} className="flex items-center">
                {i > 0 && <span className="text-neutral-700 mx-2">|</span>}
                <Link
                  to={to}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium tracking-wider transition-colors duration-200',
                    location.pathname.startsWith(to)
                      ? 'text-white'
                      : 'text-neutral-500 hover:text-white',
                  )}
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
                  </svg>
                  {label}
                </Link>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <ConnectWallet />
            <button
              className="sm:hidden p-2 rounded-lg text-neutral-400 hover:text-white transition-colors"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="sm:hidden border-t border-neutral-800/50 bg-[#0d0d0d] px-4 py-4 space-y-1 animate-fade-in">
          {navLinks.map(({ to, label, icon }) => (
            <Link
              key={to}
              to={to}
              onClick={() => setMobileOpen(false)}
              className={cn(
                'flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                location.pathname.startsWith(to)
                  ? 'text-white bg-surface'
                  : 'text-neutral-400 hover:text-white hover:bg-surface',
              )}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
              </svg>
              {label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}
