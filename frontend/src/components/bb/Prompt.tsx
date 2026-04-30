interface PromptProps {
  path?: string;
  command: string;
  blink?: boolean;
  className?: string;
}

export function Prompt({ path = '~/blindbounty', command, blink = false, className = '' }: PromptProps) {
  return (
    <div className={`font-mono text-sm text-ink-2 ${className}`}>
      <span className="text-cream">$</span>
      {' '}
      <span className="text-ink-3">{path}</span>
      {' '}
      <span className="text-ink">{command}</span>
      {blink && <span className="animate-bb-blink text-cream ml-0.5">_</span>}
    </div>
  );
}
