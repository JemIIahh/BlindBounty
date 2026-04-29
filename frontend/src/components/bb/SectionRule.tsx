interface SectionRuleProps {
  num: string;
  title: string;
  side?: string;
  className?: string;
}

export function SectionRule({ num, title, side, className = '' }: SectionRuleProps) {
  return (
    <div className={`section-rule ${className}`}>
      <span>
        <span className="section-num">{`§${num}`}</span>
        {' ─ '}
        {title}
      </span>
      {side && (
        <>
          <span className="flex-1 h-px bg-line" />
          <span className="text-ink-3">{side}</span>
        </>
      )}
    </div>
  );
}
