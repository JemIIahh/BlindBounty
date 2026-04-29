import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAccount } from 'wagmi';

type AgentStatus = 'stopped' | 'running' | 'paused';

interface DeployedAgent {
  id: string;
  ownerAddress: string;
  name: string;
  provider: string;
  model: string;
  capabilities: string[];
  tools: { type: string; name: string }[];
  status: AgentStatus;
  deployedAt: string;
  lastActiveAt?: string;
}

const STATUS_DOT: Record<AgentStatus, string> = {
  running: 'bg-[var(--bb-ok)] animate-pulse',
  paused:  'bg-[var(--bb-warn)]',
  stopped: 'bg-line-2',
};

function timeAgo(iso: string): string {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  return `${Math.floor(s / 3600)}h ago`;
}

export default function AgentMarketplace() {
  const { address } = useAccount();
  const navigate = useNavigate();
  const [agents, setAgents] = useState<DeployedAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const fetchAgents = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/agents');
      const json = await res.json();
      if (json.success) setAgents(json.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAgents(); }, [fetchAgents]);

  async function action(id: string, verb: 'start' | 'pause' | 'stop') {
    setBusy(`${id}:${verb}`);
    try {
      const res = await fetch(`/api/v1/agents/${id}/${verb}`, { method: 'POST' });
      const json = await res.json();
      if (json.success) setAgents(prev => prev.map(a => a.id === id ? { ...a, ...json.data } : a));
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="heading-display text-2xl">Agent Marketplace</h1>
          <p className="text-ink-3 text-sm font-mono mt-1">All deployed agents on the network</p>
        </div>
        <button onClick={() => navigate('/agents/deploy')} className="btn-bracket-primary">
          + Deploy agent
        </button>
      </div>

      {loading ? (
        <div className="text-center py-20 text-ink-3 font-mono text-sm">Loading agents…</div>
      ) : agents.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-ink-3 font-mono text-sm mb-4">No agents deployed yet.</p>
          <button onClick={() => navigate('/agents/deploy')} className="btn-ghost">Deploy the first one</button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {agents.map(agent => {
            const isOwner = address?.toLowerCase() === agent.ownerAddress?.toLowerCase();
            const isBusy = busy?.startsWith(agent.id);
            return (
              <div key={agent.id} className="card-dark p-5 cursor-pointer hover:border-line-2 transition-colors"
                onClick={() => navigate(`/agents/${agent.id}`)}>

                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-surface-2 border border-line flex items-center justify-center font-mono font-bold text-sm text-ink-2">
                      {agent.name.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-semibold text-ink text-sm">{agent.name}</h3>
                      <p className="text-xs text-ink-3 font-mono mt-0.5">{agent.provider} · {agent.model}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 inline-block ${STATUS_DOT[agent.status]}`} />
                    <span className="text-xs font-mono text-ink-3">{agent.status}</span>
                  </div>
                </div>

                {/* Meta row */}
                <div className="flex items-center gap-3 mb-4 text-xs font-mono text-ink-3">
                  {agent.tools?.length > 0 && (
                    <span className="chip chip-neutral">{agent.tools.length} tool{agent.tools.length !== 1 ? 's' : ''}</span>
                  )}
                  {agent.capabilities?.length > 0 && (
                    <span className="chip chip-neutral">{agent.capabilities.length} cap</span>
                  )}
                  <span className="ml-auto">
                    {agent.lastActiveAt
                      ? <span className="text-[var(--bb-ok)]">active {timeAgo(agent.lastActiveAt)}</span>
                      : <span>deployed {new Date(agent.deployedAt).toLocaleDateString()}</span>
                    }
                  </span>
                </div>

                {/* Tools preview */}
                {agent.tools?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-4">
                    {agent.tools.slice(0, 4).map((t, i) => (
                      <span key={i} className="chip chip-info">{t.type}: {t.name}</span>
                    ))}
                    {agent.tools.length > 4 && <span className="chip chip-neutral">+{agent.tools.length - 4}</span>}
                  </div>
                )}

                {/* Owner controls */}
                {isOwner && (
                  <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                    {agent.status !== 'running' && (
                      <button disabled={!!isBusy} onClick={() => action(agent.id, 'start')}
                        className="flex-1 btn-ghost text-[var(--bb-ok)] border-[var(--bb-ok)]/30 hover:border-[var(--bb-ok)] text-xs py-1.5 disabled:opacity-50">
                        {busy === `${agent.id}:start` ? '…' : '▶ Start'}
                      </button>
                    )}
                    {agent.status === 'running' && (
                      <button disabled={!!isBusy} onClick={() => action(agent.id, 'pause')}
                        className="flex-1 btn-ghost text-[var(--bb-warn)] border-[var(--bb-warn)]/30 hover:border-[var(--bb-warn)] text-xs py-1.5 disabled:opacity-50">
                        {busy === `${agent.id}:pause` ? '…' : '⏸ Pause'}
                      </button>
                    )}
                    {agent.status !== 'stopped' && (
                      <button disabled={!!isBusy} onClick={() => action(agent.id, 'stop')}
                        className="flex-1 btn-ghost text-err border-err/30 hover:border-err text-xs py-1.5 disabled:opacity-50">
                        {busy === `${agent.id}:stop` ? '…' : '⏹ Stop'}
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
