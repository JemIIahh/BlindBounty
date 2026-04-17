import { Link } from 'react-router-dom';
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
      <div className="card-dark p-5 h-full group hover:border-neutral-600 hover:shadow-glow">
        <div className="flex items-start justify-between gap-2 mb-3">
          <CategoryBadge category={category} />
          {task.isOpen ? (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Open
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              Assigned
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 text-xs text-neutral-600 mb-2">
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          </svg>
          <span>{task.locationZone || 'Global'}</span>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-neutral-600 mb-4">
          <svg className="w-3.5 h-3.5 text-amber-500/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <span>Encrypted Task</span>
        </div>

        <div className="pt-3 border-t border-neutral-800 flex items-center justify-between">
          <span className="text-lg font-bold text-white group-hover:text-amber-400 transition-colors">
            {formatCurrency(reward)}
          </span>
          <span className="text-xs text-neutral-700 font-mono">
            #{task.taskId}
          </span>
        </div>
      </div>
    </Link>
  );
}
