import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAccount, useBalance } from 'wagmi';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Breadcrumb, PageHeader, SectionRule, Tag, StatCard } from '../components/bb';
import { truncateAddress } from '../lib/utils';

interface AgentDetails {
  id: string;
  name: string;
  provider: string;
  model: string;
  status: string;
  ownerAddress: string;
  deployedAt: string;
  instructions: string;
  walletAddress?: string;
  publicKey?: string;
  inftTokenId?: number;
  tasksCompleted?: number;
  totalEarned?: string;
}

const STATUS_TONE: Record<string, 'ok' | 'warn' | 'err' | 'neutral'> = {
  running: 'ok', idle: 'neutral', paused: 'warn', stopped: 'err', error: 'err',
};

export default function AgentDetail() {
  const { id } = useParams<{ id: string }>();
  const { address } = useAccount();
  const qc = useQueryClient();

  const [agent, setAgent] = useState<AgentDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<string[]>([]);

  const { data: balance } = useBalance({
    address: agent?.walletAddress as `0x${string}` | undefined,
    query: { enabled: !!agent?.walletAddress },
  });

  useEffect(() => {
    fetch(`/api/v1/agents/${id}`)
      .then(r => r.json())
      .then(d => { if (d.success) setAgent(d.data); })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!id) return;
    const es = new EventSource(`/api/v1/agents/${id}/logs`);
    es.onmessage = e => {
      try { setLogs(prev => [...prev.slice(-199), JSON.parse(e.data)]); } catch {}
    };
    return () => es.close();
  }, [id]);

  const action = useMutation({
    mutationFn: async (act: 'start' | 'pause' | 'stop') => {
      const res = await fetch(`/api/v1/agents/${id}/${act}`, { method: 'POST' });
      return res.json();
    },
    onSuccess: (data) => {
      if (data.success) setAgent(data.data);
      qc.invalidateQueries({ queryKey: ['my-agents'] });
    },
  });

  if (loading) return <div className="text-xs font-mono text-ink-3 py-20 text-center">loading…</div>;
  if (!agent) return <div className="text-xs font-mono text-ink-3 py-20 text-center">agent not found</div>;

  const isOwner = address?.toLowerCase() === agent.ownerAddress?.toLowerCase();

  return (
    <div>
      <Breadcrumb items={['marketplace', 'agents', 'mine', agent.name]} />
      <PageHeader
        title={agent.name}
        description={`${agent.provider} · ${agent.model}`}
        right={
          <div className="flex items-center gap-3">
            <Tag tone={STATUS_TONE[agent.status] ?? 'neutral'}>{agent.status}</Tag>
            {isOwner && (
              <div className="flex gap-2 text-[11px] font-mono">
                {agent.status !== 'running' && (
                  <button onClick={() => action.mutate('start')} className="px-3 py-1 border border-green-400 text-green-400 hover:bg-green-400 hover:text-bg transition-colors">start</button>
                )}
                {agent.status === 'running' && (
                  <button onClick={() => action.mutate('pause')} className="px-3 py-1 border border-yellow-400 text-yellow-400 hover:bg-yellow-400 hover:text-bg transition-colors">pause</button>
                )}
                <button onClick={() => action.mutate('stop')} className="px-3 py-1 border border-line text-ink-3 hover:border-red-400 hover:text-red-400 transition-colors">stop</button>
              </div>
            )}
          </div>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-3 gap-0 border border-line mb-8">
        <StatCard label="tasks completed" value={String(agent.tasksCompleted ?? 0)} sub="all time" />
        <div className="border-l border-line">
          <StatCard label="earned" value={`$${parseFloat(agent.totalEarned ?? '0').toFixed(2)}`} sub="USDC" subColor="ok" />
        </div>
        <div className="border-l border-line">
          <StatCard label="wallet balance" value={balance ? `${parseFloat(balance.formatted).toFixed(4)}` : '—'} sub={balance?.symbol ?? '0G'} />
        </div>
      </div>

      <div className="grid grid-cols-[320px_1fr] gap-6">
        {/* Left */}
        <div className="space-y-6">
          <div className="border border-line p-5">
            <SectionRule num="01" title="identity" />
            <div className="mt-4 space-y-4 text-xs font-mono">
              <div>
                <div className="text-ink-3 mb-1">owner</div>
                <div className="text-ink">{truncateAddress(agent.ownerAddress)}</div>
              </div>
              <div>
                <div className="text-ink-3 mb-1">deployed</div>
                <div className="text-ink">{new Date(agent.deployedAt).toLocaleString()}</div>
              </div>
              {agent.walletAddress && (
                <div>
                  <div className="text-ink-3 mb-1">agent wallet</div>
                  <div className="text-ink break-all">{agent.walletAddress}</div>
                </div>
              )}
              {agent.inftTokenId !== undefined && (
                <div>
                  <div className="text-ink-3 mb-1">INFT token</div>
                  <div className="text-cream">#{agent.inftTokenId}</div>
                </div>
              )}
              {agent.publicKey && (
                <div>
                  <div className="text-ink-3 mb-1">public key</div>
                  <div className="text-ink">{agent.publicKey.slice(0, 18)}…{agent.publicKey.slice(-6)}</div>
                </div>
              )}
            </div>
          </div>

          <div className="border border-line p-5">
            <SectionRule num="02" title="instructions" />
            <div className="mt-3 text-xs font-mono text-ink-3 leading-relaxed whitespace-pre-wrap">{agent.instructions}</div>
          </div>
        </div>

        {/* Logs */}
        <div className="border border-line p-5 flex flex-col">
          <SectionRule num="03" title="live logs" side={agent.status === 'running' ? '● live' : undefined} />
          <div className="mt-4 flex-1 overflow-y-auto max-h-[520px] space-y-0.5">
            {logs.length > 0 ? logs.map((line, i) => (
              <div key={i} className={`px-3 py-1.5 text-xs font-mono ${line.includes('[err]') ? 'text-red-400 bg-red-900/10' : 'text-ink-3 hover:bg-surface-2'}`}>
                {line}
              </div>
            )) : (
              <div className="text-center py-16 text-xs font-mono text-ink-3">
                {agent.status === 'running' ? 'waiting for logs…' : 'start the agent to see logs'}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
