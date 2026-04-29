import type { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label?: string;
  variant?: 'primary' | 'outline' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md';
}

export function Button({ label, children, variant = 'primary', size = 'md', className = '', ...props }: ButtonProps) {
  const base = 'font-mono transition-colors disabled:opacity-50';
  const sizes = { sm: 'px-3 py-1.5 text-xs', md: 'px-4 py-2 text-sm' };
  const variants = {
    primary:   'bg-blue-600 hover:bg-blue-700 text-white',
    outline:   'border border-line text-ink-2 hover:text-ink hover:bg-surface-2',
    secondary: 'bg-gray-700 hover:bg-gray-600 text-gray-200',
    danger:    'bg-red-600 hover:bg-red-700 text-white',
    ghost:     'text-gray-400 hover:text-white hover:bg-gray-800',
  };
  return (
    <button className={`${base} ${sizes[size]} ${variants[variant]} ${className}`} {...props}>
      {label ?? children}
    </button>
  );
}
