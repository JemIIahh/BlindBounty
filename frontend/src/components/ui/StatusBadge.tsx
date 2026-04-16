import { type ReactNode } from 'react';
import { TaskStatus, TaskStatusLabels } from '../../types/api';
import { cn } from '../../lib/utils';

export interface StatusBadgeProps {
  status: TaskStatus | number;
  size?: 'sm' | 'md' | 'lg';
  showDot?: boolean;
  label?: string;
  className?: string;
  icon?: ReactNode;
}

const statusBadgeClasses: Record<number, string> = {
  [TaskStatus.Funded]: 'bg-neutral-900 text-white border-neutral-800',
  [TaskStatus.Assigned]: 'bg-neutral-900 text-neutral-300 border-neutral-800',
  [TaskStatus.Submitted]: 'bg-neutral-900 text-neutral-300 border-neutral-800',
  [TaskStatus.Verified]: 'bg-white text-neutral-950 border-neutral-200',
  [TaskStatus.Completed]: 'bg-white text-neutral-950 border-neutral-200',
  [TaskStatus.Cancelled]: 'bg-neutral-900 text-neutral-600 border-neutral-800',
  [TaskStatus.Disputed]: 'bg-neutral-900 text-neutral-400 border-neutral-700',
};

const dotOpacity: Record<number, string> = {
  [TaskStatus.Funded]: 'bg-white',
  [TaskStatus.Assigned]: 'bg-neutral-400',
  [TaskStatus.Submitted]: 'bg-neutral-300',
  [TaskStatus.Verified]: 'bg-neutral-950',
  [TaskStatus.Completed]: 'bg-neutral-950',
  [TaskStatus.Cancelled]: 'bg-neutral-600',
  [TaskStatus.Disputed]: 'bg-neutral-500',
};

const sizeClasses = {
  sm: 'px-2 py-0.5 text-2xs',
  md: 'px-2.5 py-0.5 text-xs',
  lg: 'px-3 py-1 text-sm',
};

const dotSizeClasses = {
  sm: 'w-1.5 h-1.5',
  md: 'w-2 h-2',
  lg: 'w-2.5 h-2.5',
};

export function StatusBadge({
  status,
  size = 'md',
  showDot = false,
  label,
  className,
  icon,
}: StatusBadgeProps) {
  const displayLabel = label || TaskStatusLabels[status as TaskStatus] || `Status ${status}`;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded font-medium border',
        sizeClasses[size],
        statusBadgeClasses[status] || 'bg-neutral-900 text-neutral-400 border-neutral-800',
        className
      )}
    >
      {showDot && (
        <span
          className={cn('rounded-full flex-shrink-0', dotSizeClasses[size], dotOpacity[status] || 'bg-neutral-500')}
          aria-hidden="true"
        />
      )}
      {icon && <span className="flex-shrink-0">{icon}</span>}
      <span>{displayLabel}</span>
    </span>
  );
}

export default StatusBadge;
