import { Link, useLocation } from 'react-router-dom';
import { LogoMark } from './LogoMark';

const navGroups = [
  {
    label: 'docs',
    items: [
      { to: '/how-it-works', label: 'how_it_works' },
    ],
  },
  {
    label: 'marketplace',
    items: [
      { to: '/tasks', label: 'tasks' },
      { to: '/agent', label: 'agent' },
      { to: '/worker', label: 'worker' },
      { to: '/a2a', label: 'a2a' },
    ],
  },
  {
    label: 'account',
    items: [
      { to: '/earnings', label: 'earnings' },
      { to: '/verification', label: 'verification' },
      { to: '/settings', label: 'settings' },
    ],
  },
];

export function Sidebar() {
  const location = useLocation();

  return (
    <aside className="w-[240px] h-screen fixed left-0 top-0 bg-surface border-r border-line flex flex-col z-30">
      {/* Logo */}
      <Link to="/" className="flex items-center gap-3 px-6 h-16 border-b border-line">
        <LogoMark size={26} blade="var(--bb-cream)" slit="var(--bb-surface)" />
        <span className="text-sm font-mono font-bold text-ink uppercase tracking-wider">blindbounty</span>
      </Link>

      {/* Nav groups */}
      <nav className="flex-1 overflow-y-auto py-4">
        {navGroups.map((group) => (
          <div key={group.label} className="mb-4">
            <div className="px-6 mb-2 text-[10px] font-mono font-semibold uppercase tracking-widest text-ink-3">
              {group.label}
            </div>
            {group.items.map((item) => {
              const active = location.pathname.startsWith(item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`block px-6 py-2 text-[13px] font-mono transition-colors duration-150 ${
                    active
                      ? 'text-ink border-l-2 border-cream bg-surface-2'
                      : 'text-ink-2 hover:text-ink hover:bg-surface-2 border-l-2 border-transparent'
                  }`}
                >
                  {active && <span className="text-cream mr-1">&#9656;</span>}
                  {item.label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer status */}
      <div className="px-6 py-4 border-t border-line">
        <div className="text-[10px] font-mono text-ink-3">v0.4.2 · testnet</div>
        <div className="flex items-center gap-1.5 mt-1">
          <span className="w-1.5 h-1.5 bg-ok inline-block" />
          <span className="text-[10px] font-mono text-ok">tee online</span>
        </div>
      </div>
    </aside>
  );
}
