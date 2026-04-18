import { useReputation } from '../hooks/useReputation';

/**
 * Inline decay indicator that shows decayed score + trend color.
 * Green if decayFactor > 0.9 (active), amber if 0.5-0.9, red if < 0.5 (dormant).
 */
export function DecayIndicator({ address }: { address: string }) {
  const { data, isLoading } = useReputation(address);

  if (isLoading || !data) {
    return <span className="text-[10px] text-neutral-600">...</span>;
  }

  const score = data.decayedScore ?? 0;
  const factor = data.decayFactor ?? 1;

  const trendColor =
    factor > 0.9 ? 'text-emerald-400' :
    factor > 0.5 ? 'text-amber-400' :
    'text-red-400';

  const trendLabel =
    factor > 0.9 ? 'Active' :
    factor > 0.5 ? 'Cooling' :
    'Dormant';

  const arrow =
    factor > 0.9 ? '\u2191' : // ↑
    factor > 0.5 ? '\u2192' : // →
    '\u2193'; // ↓

  return (
    <span className="inline-flex items-center gap-1" title={`Decay factor: ${factor} | Raw: ${data.rawScore} | ${trendLabel}`}>
      <span className="text-xs text-neutral-400">{score}</span>
      <span className={`text-[10px] font-bold ${trendColor}`}>{arrow}</span>
    </span>
  );
}

/**
 * Compact reputation badge for use in lists.
 * Shows decayed score, trend arrow, and tasks completed count.
 */
export function ReputationBadge({ address }: { address: string }) {
  const { data } = useReputation(address);

  if (!data) return null;

  const factor = data.decayFactor ?? 1;
  const bgColor =
    factor > 0.9 ? 'bg-emerald-500/10 border-emerald-500/20' :
    factor > 0.5 ? 'bg-amber-500/10 border-amber-500/20' :
    'bg-red-500/10 border-red-500/20';

  const textColor =
    factor > 0.9 ? 'text-emerald-400' :
    factor > 0.5 ? 'text-amber-400' :
    'text-red-400';

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${bgColor} ${textColor}`}>
      Rep: {data.decayedScore ?? 0}
      {data.offChainTasksCompleted > 0 && (
        <span className="text-neutral-500">({data.offChainTasksCompleted} tasks)</span>
      )}
    </span>
  );
}
