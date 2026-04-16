import { cn } from '../lib/utils';

interface VerificationBadgeProps {
  verified: boolean;
  className?: string;
}

export function VerificationBadge({ verified, className }: VerificationBadgeProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium border',
        verified
          ? 'bg-white text-neutral-950 border-neutral-200'
          : 'bg-neutral-900 text-neutral-500 border-neutral-800',
        className,
      )}
    >
      {verified ? (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ) : (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )}
      {verified ? 'TEE Verified' : 'Pending'}
    </div>
  );
}
