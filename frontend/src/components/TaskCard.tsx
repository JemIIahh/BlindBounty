import { Link } from 'react-router-dom';
import { Card } from './ui';
import { StatusBadge } from './ui/StatusBadge';
import { CategoryBadge } from './ui/Badge';
import type { TaskMeta } from '../types/api';
import { formatCurrency } from '../lib/utils';

interface TaskCardProps {
  task: TaskMeta;
}

const categoryMap: Record<string, 'physical_presence' | 'knowledge_access' | 'human_authority' | 'simple_action' | 'digital_physical'> = {
  physical_presence: 'physical_presence',
  knowledge_access: 'knowledge_access',
  human_authority: 'human_authority',
  simple_action: 'simple_action',
  digital_physical: 'digital_physical',
};

export function TaskCard({ task }: TaskCardProps) {
  const category = categoryMap[task.category] || 'simple_action';
  const reward = Number(task.reward) / 1e18;

  return (
    <Link to={`/tasks/${task.taskId}`}>
      <Card variant="interactive" padding="md" className="h-full">
        <div className="flex items-start justify-between gap-2 mb-3">
          <CategoryBadge category={category} />
          {task.isOpen ? (
            <StatusBadge status={0} label="Open" showDot />
          ) : (
            <StatusBadge status={1} label="Assigned" showDot />
          )}
        </div>

        <div className="flex items-center gap-1.5 text-xs text-neutral-400 mb-2">
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          </svg>
          <span>{task.locationZone || 'Global'}</span>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-neutral-400 mb-3">
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <span>Encrypted Task</span>
        </div>

        <div className="pt-3 border-t border-neutral-200 flex items-center justify-between">
          <span className="text-sm font-semibold text-neutral-950">
            {formatCurrency(reward)}
          </span>
          <span className="text-2xs text-neutral-500">
            #{task.taskId}
          </span>
        </div>
      </Card>
    </Link>
  );
}
