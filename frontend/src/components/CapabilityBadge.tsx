const COLORS: Record<string, string> = {
  data_processing: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  web_research: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  code_execution: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  content_generation: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  api_integration: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  text_analysis: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  translation: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
  summarization: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
  code_review: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  testing: 'bg-red-500/10 text-red-400 border-red-500/20',
  market_research: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
};

const DEFAULT_COLOR = 'bg-neutral-500/10 text-neutral-400 border-neutral-500/20';

export function CapabilityBadge({ capability }: { capability: string }) {
  const color = COLORS[capability] ?? DEFAULT_COLOR;
  const label = capability.replace(/_/g, ' ');
  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider rounded border ${color}`}>
      {label}
    </span>
  );
}
