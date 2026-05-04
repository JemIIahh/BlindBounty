import { useAccount } from 'wagmi';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Breadcrumb, PageHeader, SectionRule, Tag, StatCard } from '../components/bb';
import { truncateAddress } from '../lib/utils';
import { API_BASE_URL } from '../config/constants';

interface Agent {
  id: string;
  name: string;
  walletAddress: string;
  status: string;
  provider: string;
  model: string;
  tasksCompleted?: number;
  totalEarned?: string;
  createdAt?: string;
}

const STATUS_TONE: Record<string, 'ok' | 'warn' | 'err' | 'neutral'> = {
  running: 'ok', idle: 'neutral', paused: 'warn', stopped: 'err', error: 'err',
};

export default function MyAgents() {
  const { address } = useAccount();
  const qc = useQueryClient();

  const { data: agents = [], isLoading } = useQuery<Agent[]>({
    queryKey: ['my-agents', address],
    queryFn: async () => {
      const res = await fetch(`${API_BASE_URL}/api/v1/agents?owner=${address}`);
      const json = await res.json();
      return json.success ? json.data : [];
    },
    enabled: !!address,
  });

  const action = useMutation({
    mutationFn: async ({ id, act }: { id: string; act: 'start' | 'pause' | 'stop' }) => {
      const res = await fetch(`${API_BASE_URL}/api/v1/agents/${id}/${act}`, { method: 'POST' });
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-agents', address] }),
  });

  const totalEarned = agents.reduce((sum, a) => sum + parseFloat(a.totalEarned ?? '0'), 0);
  const running = agents.filter(a => a.status === 'running').length;

  return (
    <div>
      <Breadcrumb items={['marketplace', 'agents', 'mine']} />
      <PageHeader
        title="My agents"
        description="Manage your deployed agents and track their earnings."
        right={
          <Link to="/agents/deploy" className="px-4 py-2 border border-cream text-[11px] font-mono text-cream hover:bg-cream hover:text-bg transition-colors uppercase tracking-widest">
            + deploy agent
          </Link>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-3 gap-0 border border-line mb-8">
        <StatCard label="agents" value={String(agents.length)} sub={`${running} running`} subColor={running > 0 ? 'ok' : undefined} />
        <div className="border-l border-line">
          <StatCard label="total earned" value={`$${totalEarned.toFixed(2)}`} sub="USDC · all agents" subColor="ok" />
        </div>
        <div className="border-l border-line">
          <StatCard label="tasks completed" value={String(agents.reduce((s, a) => s + (a.tasksCompleted ?? 0), 0))} sub="all time" />
        </div>
      </div>

      {/* Agent list */}
      <div className="border border-line">
        <SectionRule num="01" title="deployed agents" side={`${agents.length} total`} />

        {!address ? (
          <div className="px-5 py-10 text-center text-xs font-mono text-ink-3">connect wallet to see your agents</div>
        ) : isLoading ? (
          <div className="px-5 py-10 text-center text-xs font-mono text-ink-3">loading…</div>
        ) : agents.length === 0 ? (
          <div className="px-5 py-10 flex flex-col items-center gap-3">
            <p className="text-xs font-mono text-ink-3">no agents deployed yet.</p>
            <Link to="/agents/deploy" className="text-xs font-mono text-cream hover:underline">deploy your first agent →</Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-[1fr_140px_120px_100px_80px_120px] gap-4 px-5 py-3 border-t border-line text-[11px] font-mono font-semibold uppercase tracking-widest text-ink-3">
              <span>name · wallet</span><span>model</span><span>earned</span><span>tasks</span><span>status</span><span></span>
            </div>
            {agents.map(agent => (
              <div key={agent.id} className="grid grid-cols-[1fr_140px_120px_100px_80px_120px] gap-4 px-5 py-4 border-t border-line text-[13px] font-mono items-center">
                <div>
                  <div className="text-ink"><Link to={`/agents/${agent.id}`} className="hover:text-cream hover:underline">{agent.name}</Link></div>
                  <div className="text-[11px] text-ink-3">{truncateAddress(agent.walletAddress)}</div>
                </div>
                <span className="text-ink-3 text-xs">{agent.provider} / {agent.model}</span>
                <span className="text-ink font-semibold">${parseFloat(agent.totalEarned ?? '0').toFixed(2)}</span>
                <span className="text-ink-3">{agent.tasksCompleted ?? 0}</span>
                <Tag tone={STATUS_TONE[agent.status] ?? 'neutral'}>{agent.status}</Tag>
                <div className="flex gap-2 text-[11px] font-mono">
                  {agent.status !== 'running' && (
                    <button onClick={() => action.mutate({ id: agent.id, act: 'start' })} className="text-green-400 hover:underline">start</button>
                  )}
                  {agent.status === 'running' && (
                    <button onClick={() => action.mutate({ id: agent.id, act: 'pause' })} className="text-yellow-400 hover:underline">pause</button>
                  )}
                  <button onClick={() => action.mutate({ id: agent.id, act: 'stop' })} className="text-ink-3 hover:text-red-400 hover:underline">stop</button>
                  <Link to={`/agents/${agent.id}`} className="text-cream hover:underline">logs</Link>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
