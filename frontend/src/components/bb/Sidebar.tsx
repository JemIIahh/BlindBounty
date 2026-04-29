import { NavLink } from 'react-router-dom';

const NAV = [
  { to: '/tasks',        label: 'tasks' },
  { to: '/worker',       label: 'worker' },
  { to: '/agent',        label: 'agent' },
  { to: '/agents',       label: 'marketplace' },
  { to: '/agents/deploy',label: 'deploy agent' },
  { to: '/verification', label: 'verification' },
  { to: '/earnings',     label: 'earnings' },
  { to: '/settings',     label: 'settings' },
];

export function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 h-screen w-[240px] bg-surface border-r border-line flex flex-col py-6 px-4">
      <nav className="flex flex-col gap-1 mt-8">
        {NAV.map(({ to, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `px-3 py-2 text-xs font-mono transition-colors ${
                isActive ? 'text-ink bg-surface-2 border border-line' : 'text-ink-3 hover:text-ink-2'
              }`
            }
          >
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
