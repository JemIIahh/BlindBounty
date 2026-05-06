import { useAccount } from 'wagmi';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Breadcrumb, PageHeader, SectionRule, Tag, StatCard } from '../components/bb';
import { useSocket } from '../hooks/useSocket';
import { API_BASE_URL } from '../config/constants';

interface Task {
  taskId: string;
  category: string;
  locationZone: string;
  reward: string;
  status: number;
  agent: string;
  worker?: string;
  createdAt?: string;
  requiredCapabilities?: string[];
}

const STATUS_LABELS: Record<number, string> = {
  0: 'open', 1: 'assigned', 2: 'submitted', 3: 'verified', 4: 'completed', 5: 'cancelled', 6: 'disputed',
};
const STATUS_TONE: Record<number, 'ok' | 'warn' | 'err' | 'neutral'> = {
  0: 'neutral', 1: 'warn', 2: 'warn', 3: 'ok', 4: 'ok', 5: 'err', 6: 'err',
};

function formatReward(wei: string) {
  try { return `$${(Number(BigInt(wei)) / 1e18).toFixed(2)}`; } catch { return wei; }
}

export default function MyTasks() {
  const { address } = useAccount();
  const qc = useQueryClient();

  const { data: tasks = [], isLoading } = useQuery<Task[]>({
    queryKey: ['my-tasks', address],
    queryFn: async () => {
      const res = await fetch(`${API_BASE_URL}/api/v1/tasks?limit=100`);
      const json = await res.json();
      if (!json.success) return [];
      return (json.data?.tasks ?? []).filter(
        (t: Task) => t.agent?.toLowerCase() === address?.toLowerCase()
      );
    },
    enabled: !!address,
  });

  useSocket('tasks', {
    'task:created': () => qc.invalidateQueries({ queryKey: ['my-tasks', address] }),
    'task:assigned': () => qc.invalidateQueries({ queryKey: ['my-tasks', address] }),
    'task:completed': () => qc.invalidateQueries({ queryKey: ['my-tasks', address] }),
  });

  const open = tasks.filter(t => t.status === 0).length;
  const active = tasks.filter(t => t.status === 1 || t.status === 2).length;
  const completed = tasks.filter(t => t.status === 4).length;
  const totalSpent = tasks
    .filter(t => t.status === 4)
    .reduce((s, t) => s + Number(BigInt(t.reward || '0')) / 1e18, 0);

  return (
    <div>
      <Breadcrumb items={['tasks', 'mine']} />
      <PageHeader
        title="My tasks"
        description="Tasks you've posted — track status, assignments, and completions."
        right={
          <Link to="/tasks/new" className="px-4 py-2 border border-cream text-[11px] font-mono text-cream hover:bg-cream hover:text-bg transition-colors uppercase tracking-widest">
            + post task
          </Link>
        }
      />

      <div className="grid grid-cols-4 gap-0 border border-line mb-8">
        <StatCard label="open" value={String(open)} sub="awaiting worker" />
        <div className="border-l border-line"><StatCard label="active" value={String(active)} sub="in progress" subColor="warn" /></div>
        <div className="border-l border-line"><StatCard label="completed" value={String(completed)} sub="all time" subColor="ok" /></div>
        <div className="border-l border-line"><StatCard label="total spent" value={`$${totalSpent.toFixed(2)}`} sub="USDC paid out" /></div>
      </div>

      <div className="border border-line">
        <SectionRule num="01" title="posted tasks" side={`${tasks.length} total`} />

        {!address ? (
          <div className="px-5 py-10 text-center text-xs font-mono text-ink-3">connect wallet to see your tasks</div>
        ) : isLoading ? (
          <div className="px-5 py-10 text-center text-xs font-mono text-ink-3">loading…</div>
        ) : tasks.length === 0 ? (
          <div className="px-5 py-10 flex flex-col items-center gap-3">
            <p className="text-xs font-mono text-ink-3">no tasks posted yet.</p>
            <Link to="/tasks/new" className="text-xs font-mono text-cream hover:underline">post your first task →</Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-[80px_1fr_120px_140px_100px_60px] gap-4 px-5 py-3 border-t border-line text-[11px] font-mono font-semibold uppercase tracking-widest text-ink-3">
              <span>id</span><span>category · zone</span><span>reward</span><span>worker</span><span>status</span><span></span>
            </div>
            {tasks.map(t => (
              <div key={t.taskId} className="grid grid-cols-[80px_1fr_120px_140px_100px_60px] gap-4 px-5 py-4 border-t border-line text-[13px] font-mono items-center">
                <span className="text-ink-3">#{t.taskId}</span>
                <div>
                  <span className="text-ink">{t.category}</span>
                  <span className="text-ink-3"> · {t.locationZone || 'global'}</span>
                  {t.requiredCapabilities && t.requiredCapabilities.length > 0 && (
                    <div className="flex gap-1 mt-1 flex-wrap">
                      {t.requiredCapabilities.slice(0, 3).map(c => (
                        <span key={c} className="text-[10px] font-mono text-ink-3 border border-line px-1">{c.replace(/_/g, ' ')}</span>
                      ))}
                    </div>
                  )}
                </div>
                <span className="text-cream font-semibold">{formatReward(t.reward)}</span>
                <span className="text-ink-3 text-[11px]">
                  {t.worker ? `${t.worker.slice(0, 6)}…${t.worker.slice(-4)}` : '—'}
                </span>
                <Tag tone={STATUS_TONE[t.status] ?? 'neutral'}>{STATUS_LABELS[t.status] ?? t.status}</Tag>
                <Link to={`/tasks/${t.taskId}`} className="text-[11px] font-mono text-cream hover:underline">view →</Link>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
