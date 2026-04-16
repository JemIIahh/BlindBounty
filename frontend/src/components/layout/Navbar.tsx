import { Link, useLocation } from 'react-router-dom';
import { ConnectWallet } from '../ConnectWallet';
import { cn } from '../../lib/utils';

const navLinks = [
  { to: '/tasks', label: 'Tasks' },
  { to: '/agent', label: 'Agent' },
  { to: '/worker', label: 'Worker' },
];

export function Navbar() {
  const location = useLocation();

  return (
    <nav className="bg-neutral-950 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          <div className="flex items-center gap-8">
            <Link to="/" className="text-sm font-bold text-white tracking-wider">
              BLINDBOUNTY
            </Link>
            <div className="hidden sm:flex items-center gap-1">
              {navLinks.map(({ to, label }) => (
                <Link
                  key={to}
                  to={to}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                    location.pathname.startsWith(to)
                      ? 'bg-neutral-800 text-white'
                      : 'text-neutral-400 hover:text-white',
                  )}
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>
          <ConnectWallet />
        </div>
      </div>
    </nav>
  );
}
