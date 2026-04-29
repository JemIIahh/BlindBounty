export { DashboardLayout } from './DashboardLayout';
export { TopBar } from './TopBar';
export { Sidebar } from './Sidebar';
export { LogoMark } from './LogoMark';
export { Button } from './Button';

import type { ReactNode } from 'react';
import { createElement as h } from 'react';

export function Breadcrumb({ items }: { items: (string | { label: string; href?: string })[] }) {
  return h('nav', { className: 'text-xs text-gray-400 flex gap-1 mb-4' },
    items.map((item, i) => {
      const label = typeof item === 'string' ? item : item.label;
      const href  = typeof item === 'string' ? undefined : item.href;
      return h('span', { key: i, className: 'flex items-center gap-1' },
        i > 0 && h('span', null, '/'),
        href ? h('a', { href, className: 'hover:text-white' }, label)
             : h('span', { className: 'text-gray-200' }, label)
      );
    })
  );
}

export function PageHeader({ title, subtitle, description, right }: { title: string; subtitle?: string; description?: string; right?: ReactNode }) {
  return h('div', { className: 'flex items-start justify-between mb-6' },
    h('div', null,
      h('h1', { className: 'text-2xl font-bold text-white' }, title),
      (subtitle || description) && h('p', { className: 'text-gray-400 text-sm mt-1' }, subtitle ?? description)
    ),
    right && h('div', null, right)
  );
}

export function SectionRule({ label, num, title, side, className = '' }: { label?: string; num?: string; title?: string; side?: string; className?: string }) {
  const text = label ?? (num && title ? `${num} — ${title}` : num ?? title);
  return h('div', { className: `flex items-center gap-3 my-6 ${className}` },
    h('div', { className: 'flex-1 border-t border-gray-700' }),
    text && h('span', { className: 'text-xs text-gray-500 whitespace-nowrap' }, text),
    side && h('span', { className: 'text-xs text-gray-500 whitespace-nowrap' }, side),
    h('div', { className: 'flex-1 border-t border-gray-700' })
  );
}

export function Tag({ children, color, tone }: { children: ReactNode; color?: string; tone?: string }) {
  const c = color ?? tone ?? 'gray';
  return h('span', {
    className: `inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-${c}-900/40 text-${c}-400`
  }, children);
}

export function FormField({ label, hint, children, required }: { label: string; hint?: string; children: ReactNode; required?: boolean }) {
  return h('div', { className: 'space-y-1' },
    h('label', { className: 'block text-sm font-medium text-gray-300' },
      label, required && h('span', { className: 'text-red-400 ml-1' }, '*')
    ),
    children,
    hint && h('p', { className: 'text-xs text-gray-500' }, hint)
  );
}

export function FormInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return h('input', {
    className: 'w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500',
    ...props,
  });
}

export function FormTextarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return h('textarea', {
    className: 'w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none',
    ...props,
  });
}

export function Panel({ children, className = '' }: { children: ReactNode; className?: string }) {
  return h('div', { className: `bg-gray-900 border border-gray-700 rounded-xl p-5 ${className}` }, children);
}

export function Prompt({ children, command, blink }: { children?: ReactNode; command?: string; blink?: boolean }) {
  return h('div', { className: 'bg-gray-800 border border-gray-700 rounded-lg p-4 font-mono text-sm text-gray-300 flex items-center gap-2' },
    command ?? children,
    blink && h('span', { className: 'animate-pulse' }, '▋')
  );
}

export function StatCard({ label, value, num, title, sub, subColor }: {
  label?: string; value?: ReactNode; num?: string; title?: string; sub?: string; subColor?: string;
}) {
  return h('div', { className: 'bg-gray-800 rounded-xl p-4 border border-gray-700' },
    h('p', { className: 'text-xs text-gray-400 mb-1' }, label ?? title),
    h('p', { className: 'text-xl font-bold text-white' }, value ?? num),
    sub && h('p', { className: `text-xs mt-1 ${subColor ?? 'text-gray-500'}` }, sub)
  );
}
