interface TagProps {
  tone?: 'ok' | 'warn' | 'err' | 'info' | 'neutral';
  children: React.ReactNode;
  className?: string;
}

export function Tag({ tone = 'neutral', children, className = '' }: TagProps) {
  return (
    <span className={`chip chip-${tone} ${className}`}>
      {children}
    </span>
  );
}
