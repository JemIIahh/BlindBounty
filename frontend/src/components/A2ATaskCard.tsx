import { CapabilityBadge } from './CapabilityBadge';
import type { A2ATaskEntry } from '../services/a2a';

const STATUS_COLORS: Record<string, string> = {
  open: 'text-emerald-400',
  accepted: 'text-blue-400',
  in_progress: 'text-amber-400',
  submitted: 'text-purple-400',
  verified: 'text-cyan-400',
  completed: 'text-emerald-400',
  failed: 'text-red-400',
};

interface Props {
  entry: A2ATaskEntry;
  onAccept?: (taskId: string) => void;
  onSubmit?: (taskId: string) => void;
  accepting?: boolean;
}

export function A2ATaskCard({ entry, onAccept, onSubmit, accepting }: Props) {
  const { meta, state } = entry;
  const statusColor = STATUS_COLORS[state.status] ?? 'text-neutral-400';

  return (
    <div className="card-dark p-5 space-y-3">
      <div className="flex items-center justify-between">
        <code className="text-xs font-mono text-neutral-500 truncate max-w-[200px]">
          {meta.taskId.slice(0, 16)}...
        </code>
        <span className={`text-xs font-medium uppercase tracking-wider ${statusColor}`}>
          {state.status}
        </span>
      </div>

      <div className="flex items-center gap-2 text-xs text-neutral-500">
        <span className="px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-300">
          {meta.targetExecutorType}
        </span>
        <span className="px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-300">
          {meta.verificationMode}
        </span>
      </div>

      {meta.requiredCapabilities.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {meta.requiredCapabilities.map((cap) => (
            <CapabilityBadge key={cap} capability={cap} />
          ))}
        </div>
      )}

      {state.verificationResult && (
        <div className={`text-xs p-2 rounded ${state.verificationResult.passed ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
          {state.verificationResult.passed ? 'Verified' : 'Failed'}: {state.verificationResult.reasons.join(', ')}
        </div>
      )}

      <div className="flex gap-2">
        {state.status === 'open' && onAccept && (
          <button
            className="btn-accent text-xs px-3 py-1.5"
            onClick={() => onAccept(meta.taskId)}
            disabled={accepting}
          >
            {accepting ? 'Accepting...' : 'Accept'}
          </button>
        )}
        {(state.status === 'accepted' || state.status === 'in_progress') && onSubmit && (
          <button
            className="btn-accent text-xs px-3 py-1.5"
            onClick={() => onSubmit(meta.taskId)}
          >
            Submit Work
          </button>
        )}
      </div>
    </div>
  );
}
