interface StatCardProps {
  label: string;
  value: string;
  sub?: string;
  subColor?: 'ok' | 'warn' | 'err' | 'default';
  className?: string;
}

export function StatCard({ label, value, sub, subColor = 'default', className = '' }: StatCardProps) {
  const subColorClass = {
    ok: 'text-ok',
    warn: 'text-warn',
    err: 'text-err',
    default: 'text-ink-3',
  }[subColor];

  return (
    <div className={`card-dark p-5 ${className}`}>
      <div className="text-[10px] font-mono font-semibold uppercase tracking-widest text-ink-3 mb-2">
        {label}
      </div>
      <div className="text-[32px] font-mono font-bold text-ink leading-none tracking-tightest">
        {value}
      </div>
      {sub && (
        <div className={`text-[11px] font-mono mt-1.5 ${subColorClass}`}>
          {sub}
        </div>
      )}
    </div>
  );
}
