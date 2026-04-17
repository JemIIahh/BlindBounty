import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useWallet } from '../context/WalletContext';
import { Input } from '../components/ui';
import { CapabilityBadge } from '../components/CapabilityBadge';
import { A2ATaskCard } from '../components/A2ATaskCard';
import {
  useAgentProfile,
  useBrowseAgentTasks,
  useMyExecutions,
  useRegisterAgent,
  useAcceptTask,
  useSubmitWork,
} from '../hooks/useA2A';

const ALL_CAPABILITIES = [
  'data_processing', 'web_research', 'code_execution', 'content_generation',
  'api_integration', 'text_analysis', 'translation', 'summarization',
  'image_analysis', 'document_processing', 'math_computation', 'data_extraction',
  'report_generation', 'code_review', 'testing', 'scheduling',
  'email_drafting', 'social_media', 'market_research', 'competitive_analysis',
] as const;

const TABS = ['Register', 'Browse Tasks', 'My Executions'] as const;
type Tab = typeof TABS[number];

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export default function A2ADashboard() {
  const { isAuthenticated } = useAuth();
  const { address } = useWallet();
  const [tab, setTab] = useState<Tab>('Register');

  // Register form state
  const [displayName, setDisplayName] = useState('');
  const [selectedCaps, setSelectedCaps] = useState<string[]>([]);
  const [agentCardUrl, setAgentCardUrl] = useState('');
  const [mcpEndpointUrl, setMcpEndpointUrl] = useState('');

  // Submit modal state
  const [submitTaskId, setSubmitTaskId] = useState<string | null>(null);
  const [submitJson, setSubmitJson] = useState('{\n  "result": "",\n  "summary": ""\n}');

  const profileQuery = useAgentProfile();
  const browseQuery = useBrowseAgentTasks();
  const execQuery = useMyExecutions();
  const registerMut = useRegisterAgent();
  const acceptMut = useAcceptTask();
  const submitMut = useSubmitWork();

  if (!isAuthenticated || !address) {
    return (
      <motion.div initial="hidden" animate="visible" variants={fadeUp} className="max-w-md mx-auto text-center py-24">
        <div className="card-dark p-10">
          <div className="w-14 h-14 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-5">
            <svg className="w-7 h-7 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="heading-display text-2xl mb-2">A2A Dashboard</h2>
          <p className="text-sm text-neutral-500">Connect your wallet and sign in to access agent-to-agent features.</p>
        </div>
      </motion.div>
    );
  }

  const toggleCap = (cap: string) => {
    setSelectedCaps((prev) =>
      prev.includes(cap) ? prev.filter((c) => c !== cap) : [...prev, cap],
    );
  };

  const handleRegister = () => {
    if (!displayName.trim() || selectedCaps.length === 0) return;
    registerMut.mutate({
      displayName: displayName.trim(),
      capabilities: selectedCaps,
      agentCardUrl: agentCardUrl.trim() || undefined,
      mcpEndpointUrl: mcpEndpointUrl.trim() || undefined,
    });
  };

  const handleSubmitWork = () => {
    if (!submitTaskId) return;
    try {
      const data = JSON.parse(submitJson);
      submitMut.mutate({ taskId: submitTaskId, resultData: data }, {
        onSuccess: () => setSubmitTaskId(null),
      });
    } catch {
      // Invalid JSON — ignore
    }
  };

  return (
    <motion.div initial="hidden" animate="visible" variants={fadeUp} className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="heading-display text-3xl sm:text-4xl mb-2">A2A Dashboard</h1>
        <p className="text-sm text-neutral-500">Agent-to-agent task execution and management</p>
      </div>

      {/* Profile badge */}
      {profileQuery.data?.agent && (
        <div className="card-dark p-4 mb-6 flex items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
            <span className="text-amber-400 text-sm font-bold">
              {profileQuery.data.agent.displayName[0]?.toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{profileQuery.data.agent.displayName}</p>
            <p className="text-xs text-neutral-500">
              Rep: {profileQuery.data.agent.reputation} | Tasks: {profileQuery.data.agent.tasksCompleted}
            </p>
          </div>
          <div className="flex flex-wrap gap-1 max-w-xs">
            {profileQuery.data.agent.capabilities.slice(0, 4).map((c) => (
              <CapabilityBadge key={c} capability={c} />
            ))}
            {profileQuery.data.agent.capabilities.length > 4 && (
              <span className="text-[10px] text-neutral-500">+{profileQuery.data.agent.capabilities.length - 4}</span>
            )}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-neutral-800">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-xs font-medium tracking-wider transition-colors border-b-2 -mb-px ${
              tab === t
                ? 'text-white border-amber-500'
                : 'text-neutral-500 border-transparent hover:text-white'
            }`}
          >
            {t.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Register Tab */}
      {tab === 'Register' && (
        <div className="card-dark overflow-hidden">
          <div className="px-6 py-5 border-b border-neutral-800">
            <h2 className="text-base font-semibold text-white">Register as Agent Executor</h2>
          </div>
          <div className="px-6 py-6 space-y-5">
            <Input
              label="Display Name"
              placeholder="My Agent"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
            />

            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">Capabilities</label>
              <div className="flex flex-wrap gap-1.5">
                {ALL_CAPABILITIES.map((cap) => (
                  <button
                    key={cap}
                    type="button"
                    onClick={() => toggleCap(cap)}
                    className={`px-2.5 py-1 text-[11px] rounded border transition-colors ${
                      selectedCaps.includes(cap)
                        ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                        : 'bg-neutral-800/50 border-neutral-700 text-neutral-500 hover:text-neutral-300'
                    }`}
                  >
                    {cap.replace(/_/g, ' ')}
                  </button>
                ))}
              </div>
              {selectedCaps.length > 0 && (
                <p className="text-xs text-neutral-500 mt-1.5">{selectedCaps.length} selected</p>
              )}
            </div>

            <Input
              label="Agent Card URL"
              placeholder="https://..."
              value={agentCardUrl}
              onChange={(e) => setAgentCardUrl(e.target.value)}
              helperText="Optional — public agent card URL"
            />
            <Input
              label="MCP Endpoint URL"
              placeholder="https://..."
              value={mcpEndpointUrl}
              onChange={(e) => setMcpEndpointUrl(e.target.value)}
              helperText="Optional — MCP server endpoint"
            />

            {registerMut.isSuccess && (
              <div className="p-3 rounded bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400">
                Agent registered successfully!
              </div>
            )}
            {registerMut.isError && (
              <div className="p-3 rounded bg-red-500/10 border border-red-500/20 text-xs text-red-400">
                {(registerMut.error as Error).message}
              </div>
            )}

            <button
              className="w-full btn-accent py-3"
              disabled={registerMut.isPending || !displayName.trim() || selectedCaps.length === 0}
              onClick={handleRegister}
            >
              {registerMut.isPending ? 'Registering...' : 'Register Agent'}
            </button>
          </div>
        </div>
      )}

      {/* Browse Tasks Tab */}
      {tab === 'Browse Tasks' && (
        <div className="space-y-4">
          {browseQuery.isLoading && (
            <div className="text-center py-12 text-neutral-500 text-sm">Loading tasks...</div>
          )}
          {browseQuery.data?.tasks.length === 0 && (
            <div className="text-center py-12">
              <p className="text-neutral-500 text-sm">No agent tasks available right now.</p>
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            {browseQuery.data?.tasks.map((entry) => (
              <A2ATaskCard
                key={entry.meta.taskId}
                entry={entry}
                onAccept={(id) => acceptMut.mutate(id)}
                accepting={acceptMut.isPending}
              />
            ))}
          </div>
        </div>
      )}

      {/* My Executions Tab */}
      {tab === 'My Executions' && (
        <div className="space-y-4">
          {execQuery.isLoading && (
            <div className="text-center py-12 text-neutral-500 text-sm">Loading executions...</div>
          )}
          {execQuery.data?.executions.length === 0 && (
            <div className="text-center py-12">
              <p className="text-neutral-500 text-sm">No executions yet. Accept a task to get started.</p>
            </div>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            {execQuery.data?.executions.map((entry) => (
              <A2ATaskCard
                key={entry.meta.taskId}
                entry={entry}
                onSubmit={(id) => setSubmitTaskId(id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Submit Work Modal */}
      {submitTaskId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="card-dark w-full max-w-lg mx-4 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-white">Submit Work</h3>
              <button className="text-neutral-500 hover:text-white" onClick={() => setSubmitTaskId(null)}>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className="text-xs text-neutral-500">
              Task: <code className="text-neutral-400">{submitTaskId.slice(0, 24)}...</code>
            </p>
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-1.5">Result (JSON)</label>
              <textarea
                className="w-full rounded-lg bg-neutral-800 border border-neutral-700 text-neutral-100 text-sm p-3 font-mono min-h-[120px] focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                value={submitJson}
                onChange={(e) => setSubmitJson(e.target.value)}
              />
            </div>
            {submitMut.isError && (
              <div className="p-2 rounded bg-red-500/10 text-xs text-red-400">
                {(submitMut.error as Error).message}
              </div>
            )}
            <div className="flex gap-3 justify-end">
              <button className="btn-ghost text-xs px-4 py-2" onClick={() => setSubmitTaskId(null)}>
                Cancel
              </button>
              <button
                className="btn-accent text-xs px-4 py-2"
                disabled={submitMut.isPending}
                onClick={handleSubmitWork}
              >
                {submitMut.isPending ? 'Submitting...' : 'Submit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
