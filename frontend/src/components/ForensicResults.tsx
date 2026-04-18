import type { ForensicValidation, ForensicCheck } from '../lib/forensicTypes';
import { Badge } from './ui';

interface ForensicResultsProps {
  validation: ForensicValidation;
}

function CheckIcon({ passed }: { passed: boolean }) {
  if (passed) {
    return (
      <svg className="w-4 h-4 text-emerald-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    );
  }
  return (
    <svg className="w-4 h-4 text-red-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function severityVariant(severity: ForensicCheck['severity']) {
  return severity === 'critical' ? 'danger' as const : severity === 'warning' ? 'warning' as const : 'info' as const;
}

export function ForensicResults({ validation }: ForensicResultsProps) {
  const scoreColor = validation.overallScore >= 80
    ? 'text-emerald-400'
    : validation.overallScore >= 50
      ? 'text-amber-400'
      : 'text-red-400';

  return (
    <div className="rounded-xl border border-neutral-800 overflow-hidden">
      <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <h2 className="text-sm font-semibold text-white">Forensic Analysis</h2>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-xl font-bold ${scoreColor}`}>{validation.overallScore}%</span>
          <Badge variant={validation.passed ? 'success' : 'danger'} size="sm">
            {validation.passed ? 'PASSED' : 'FAILED'}
          </Badge>
        </div>
      </div>

      <div className="px-6 py-4 space-y-2">
        {validation.checks.map((check) => (
          <div key={check.name} className="flex items-center gap-3 py-1.5">
            <CheckIcon passed={check.passed} />
            <div className="flex-1 min-w-0">
              <span className="text-sm text-neutral-300">{check.name.replace(/_/g, ' ')}</span>
              <p className="text-xs text-neutral-500 truncate">{check.detail}</p>
            </div>
            <Badge variant={severityVariant(check.severity)} size="sm">{check.severity}</Badge>
          </div>
        ))}
      </div>

      {validation.flags.length > 0 && (
        <div className="px-6 py-3 border-t border-neutral-800">
          <div className="flex flex-wrap gap-1.5">
            {validation.flags.map((flag) => (
              <Badge key={flag} variant="warning" size="sm">{flag.replace(/_/g, ' ')}</Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
