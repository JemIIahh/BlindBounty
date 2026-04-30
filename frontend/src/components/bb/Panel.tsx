interface PanelProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'sm' | 'md' | 'lg';
}

export function Panel({ children, className = '', padding = 'md' }: PanelProps) {
  const pad = { sm: 'p-4', md: 'p-7', lg: 'p-10' }[padding];

  return (
    <div className={`card-dark ${pad} ${className}`}>
      {children}
    </div>
  );
}
