import { useState } from 'react';
import { motion } from 'framer-motion';
import { useWallet } from '../context/WalletContext';
import { useAuth } from '../context/AuthContext';
import { useTxSend } from '../hooks/useTxSend';
import { Input, Textarea, Select } from '../components/ui';
import { TxPendingModal } from '../components/TxPendingModal';
import { buildCreateTask } from '../services/tasks';
import { uploadBlob } from '../services/storage';
import { useAccountingEntries, useAccountingSummary } from '../hooks/useAccounting';
import { buildExportUrl } from '../services/accounting';
import {
  generateAesKey,
  aesEncrypt,
  eciesEncrypt,
  sha256,
  toBytes,
  toBase64,
  generateKeyPair,
} from '../lib/crypto';

const categories = [
  { value: 'physical_presence', label: 'Physical Presence' },
  { value: 'knowledge_access', label: 'Knowledge Access' },
  { value: 'human_authority', label: 'Human Authority' },
  { value: 'simple_action', label: 'Simple Action' },
  { value: 'digital_physical', label: 'Digital-Physical' },
];

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export default function AgentDashboard() {
  const { address } = useWallet();
  const { isAuthenticated } = useAuth();
  const txSend = useTxSend();

  const [instructions, setInstructions] = useState('');
  const [category, setCategory] = useState('simple_action');
  const [locationZone, setLocationZone] = useState('');
  const [amount, setAmount] = useState('');
  const [token, setToken] = useState('');
  const [duration, setDuration] = useState('86400');
  const [targetExecutorType, setTargetExecutorType] = useState<'human' | 'agent'>('human');
  const [verificationMode, setVerificationMode] = useState<'manual' | 'auto' | 'oracle'>('manual');
  const [requiredCapabilities, setRequiredCapabilities] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);
  const [createdId, setCreatedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'create' | 'accounting'>('create');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [txType, setTxType] = useState('');
  const { data: entriesData } = useAccountingEntries(dateFrom || undefined, dateTo || undefined, txType || undefined);
  const { data: summaryData } = useAccountingSummary(dateFrom || undefined, dateTo || undefined);

  if (!isAuthenticated || !address) {
    return (
      <motion.div initial="hidden" animate="visible" variants={fadeUp} className="max-w-md mx-auto text-center py-24">
        <div className="card-dark p-10">
          <div className="w-14 h-14 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-5">
            <svg className="w-7 h-7 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="heading-display text-2xl mb-2">Agent Dashboard</h2>
          <p className="text-sm text-neutral-500">Connect your wallet and sign in to create tasks.</p>
        </div>
      </motion.div>
    );
  }

  const handleCreate = async () => {
    if (!instructions.trim() || !amount || !token) return;
    setCreating(true);
    try {
      const agentKeys = generateKeyPair();
      const aesKey = await generateAesKey();
      const encrypted = await aesEncrypt(toBytes(instructions), aesKey);
      const encryptedB64 = toBase64(encrypted);
      const { rootHash } = await uploadBlob(encryptedB64);
      const taskHash = '0x' + await sha256(encrypted);
      const wrappedKey = await eciesEncrypt(aesKey, agentKeys.publicKey);
      const unsignedTx = await buildCreateTask({
        taskHash, token, amount, category, locationZone, duration,
        ...(targetExecutorType === 'agent' ? {
          targetExecutorType,
          verificationMode,
          requiredCapabilities: requiredCapabilities.length > 0 ? requiredCapabilities : undefined,
        } : {}),
      });
      const receipt = await new Promise<{ hash: string }>((resolve, reject) => {
        txSend.mutate(unsignedTx, {
          onSuccess: (r) => resolve({ hash: r.hash }),
          onError: reject,
        });
      });
      const taskData = {
        taskHash, rootHash,
        wrappedKey: toBase64(wrappedKey),
        agentPublicKey: agentKeys.publicKey,
        txHash: receipt.hash,
      };
      try {
        const stored = JSON.parse(localStorage.getItem('blindbounty_tasks') || '[]');
        stored.push({
          ...taskData,
          agentPrivateKey: agentKeys.privateKey,
          createdAt: new Date().toISOString(),
        });
        localStorage.setItem('blindbounty_tasks', JSON.stringify(stored));
      } catch {
        // localStorage may be unavailable
      }
      setCreatedId(rootHash);
      setInstructions('');
      setAmount('');
    } finally {
      setCreating(false);
    }
  };

  return (
    <motion.div initial="hidden" animate="visible" variants={fadeUp} className="max-w-2xl mx-auto">
      <TxPendingModal open={txSend.isPending} />

      <div className="mb-6">
        <h1 className="heading-display text-3xl sm:text-4xl mb-2">Agent Dashboard</h1>
        <p className="text-sm text-neutral-500">Create and manage encrypted tasks</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-neutral-800 mb-6">
        <button
          onClick={() => setActiveTab('create')}
          className={`pb-2 text-sm font-medium transition-colors ${
            activeTab === 'create'
              ? 'text-amber-400 border-b-2 border-amber-400'
              : 'text-neutral-500 hover:text-neutral-300'
          }`}
        >
          Create Task
        </button>
        <button
          onClick={() => setActiveTab('accounting')}
          className={`pb-2 text-sm font-medium transition-colors ${
            activeTab === 'accounting'
              ? 'text-amber-400 border-b-2 border-amber-400'
              : 'text-neutral-500 hover:text-neutral-300'
          }`}
        >
          Accounting
        </button>
      </div>

      {activeTab === 'accounting' ? (
        <div className="space-y-6">
          {/* Filters */}
          <div className="flex flex-wrap gap-3 items-end">
            <div>
              <label className="block text-[10px] text-neutral-500 uppercase tracking-wider mb-1">From</label>
              <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
                className="bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-1.5 text-sm text-neutral-300" />
            </div>
            <div>
              <label className="block text-[10px] text-neutral-500 uppercase tracking-wider mb-1">To</label>
              <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
                className="bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-1.5 text-sm text-neutral-300" />
            </div>
            <div>
              <label className="block text-[10px] text-neutral-500 uppercase tracking-wider mb-1">Type</label>
              <select value={txType} onChange={(e) => setTxType(e.target.value)}
                className="bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-1.5 text-sm text-neutral-300">
                <option value="">All</option>
                <option value="escrow_lock">Escrow Lock</option>
                <option value="payment">Payment</option>
                <option value="fee">Fee</option>
                <option value="refund">Refund</option>
                <option value="stake">Stake</option>
                <option value="slash">Slash</option>
                <option value="stake_return">Stake Return</option>
              </select>
            </div>
          </div>

          {/* Summary Cards */}
          {summaryData && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Total Earned', value: summaryData.totalEarned, color: 'text-emerald-400' },
                { label: 'Fees', value: summaryData.totalFees, color: 'text-amber-400' },
                { label: 'Net Revenue', value: summaryData.netRevenue, color: 'text-blue-400' },
                { label: 'Transactions', value: summaryData.taskCount, color: 'text-neutral-300' },
              ].map((stat) => (
                <div key={stat.label} className="card-dark p-4 text-center">
                  <div className={`text-lg font-bold ${stat.color}`}>{stat.value}</div>
                  <div className="text-[10px] uppercase tracking-wider text-neutral-600 mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
          )}

          {/* Transaction Table */}
          <div className="card-dark overflow-hidden">
            <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white">Transactions ({entriesData?.total ?? 0})</h2>
              <div className="flex gap-2">
                <a
                  href={buildExportUrl('csv', dateFrom || undefined, dateTo || undefined)}
                  className="px-3 py-1 text-xs font-medium rounded-lg border border-neutral-700 text-neutral-300 hover:border-neutral-500 transition-colors"
                >
                  Export CSV
                </a>
                <a
                  href={buildExportUrl('json', dateFrom || undefined, dateTo || undefined)}
                  className="px-3 py-1 text-xs font-medium rounded-lg border border-neutral-700 text-neutral-300 hover:border-neutral-500 transition-colors"
                >
                  Export JSON
                </a>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[10px] text-neutral-500 uppercase tracking-wider">
                    <th className="px-6 py-3 text-left">Date</th>
                    <th className="px-6 py-3 text-left">Task</th>
                    <th className="px-6 py-3 text-left">Type</th>
                    <th className="px-6 py-3 text-right">Amount</th>
                    <th className="px-6 py-3 text-right">Fee</th>
                    <th className="px-6 py-3 text-right">Net</th>
                    <th className="px-6 py-3 text-left">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800">
                  {entriesData?.transactions?.map((tx) => (
                    <tr key={tx.id} className="text-neutral-300">
                      <td className="px-6 py-3 text-xs">{new Date(tx.created_at).toLocaleDateString()}</td>
                      <td className="px-6 py-3 text-xs font-mono">{tx.task_id ?? '-'}</td>
                      <td className="px-6 py-3">
                        <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium bg-neutral-800 border border-neutral-700">
                          {tx.type}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-right text-xs">{tx.amount}</td>
                      <td className="px-6 py-3 text-right text-xs text-neutral-500">{tx.fee}</td>
                      <td className="px-6 py-3 text-right text-xs">{tx.net}</td>
                      <td className="px-6 py-3 text-xs">{tx.status}</td>
                    </tr>
                  ))}
                  {(!entriesData?.transactions || entriesData.transactions.length === 0) && (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-neutral-500 text-sm">No transactions yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <>

      {createdId && (
        <div className="card-dark p-5 mb-6 border-emerald-500/20 flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
            <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-emerald-400">Task created successfully!</p>
            <p className="text-sm text-neutral-500 mt-0.5">
              Root hash: <code className="text-xs font-mono text-neutral-400">{createdId}</code>
            </p>
          </div>
        </div>
      )}

      <div className="card-dark overflow-hidden">
        <div className="px-6 sm:px-8 py-5 border-b border-neutral-800">
          <h2 className="text-base font-semibold text-white">Create Encrypted Task</h2>
        </div>
        <div className="px-6 sm:px-8 py-6">
          <div className="space-y-5">
            <Textarea
              label="Task Instructions"
              placeholder="Describe what the worker needs to do..."
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              rows={5}
              required
              helperText="Instructions will be AES-256 encrypted before upload"
            />
            <Select
              label="Category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              options={categories}
            />
            <Input
              label="Location Zone"
              placeholder="e.g., US-NY, EU-DE, Global"
              value={locationZone}
              onChange={(e) => setLocationZone(e.target.value)}
            />
            <Input
              label="Token Address"
              placeholder="0x..."
              value={token}
              onChange={(e) => setToken(e.target.value)}
              required
              helperText="ERC-20 token used for escrow payment"
            />
            <Input
              label="Amount (in wei)"
              placeholder="1000000000000000000"
              type="text"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
            <Input
              label="Duration (seconds)"
              placeholder="86400"
              type="text"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              helperText="Time allowed for task completion (default: 24h)"
            />

            {/* A2A Options */}
            <div className="border-t border-neutral-800 pt-5 space-y-4">
              <p className="section-label text-neutral-400">A2A Options</p>
              <Select
                label="Target Executor"
                value={targetExecutorType}
                onChange={(e) => setTargetExecutorType(e.target.value as 'human' | 'agent')}
                options={[
                  { value: 'human', label: 'Human Worker' },
                  { value: 'agent', label: 'Agent Executor' },
                ]}
              />
              {targetExecutorType === 'agent' && (
                <>
                  <Select
                    label="Verification Mode"
                    value={verificationMode}
                    onChange={(e) => setVerificationMode(e.target.value as 'manual' | 'auto' | 'oracle')}
                    options={[
                      { value: 'manual', label: 'Manual Review' },
                      { value: 'auto', label: 'Auto-Verify' },
                      { value: 'oracle', label: 'Oracle' },
                    ]}
                  />
                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-2">Required Capabilities</label>
                    <div className="flex flex-wrap gap-1.5">
                      {(['web_research', 'code_execution', 'content_generation', 'data_processing',
                        'text_analysis', 'summarization', 'api_integration', 'code_review'] as const).map((cap) => (
                        <button
                          key={cap}
                          type="button"
                          onClick={() => setRequiredCapabilities((prev) =>
                            prev.includes(cap) ? prev.filter((c) => c !== cap) : [...prev, cap]
                          )}
                          className={`px-2 py-0.5 text-[11px] rounded border transition-colors ${
                            requiredCapabilities.includes(cap)
                              ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                              : 'bg-neutral-800/50 border-neutral-700 text-neutral-500 hover:text-neutral-300'
                          }`}
                        >
                          {cap.replace(/_/g, ' ')}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            <button
              className="w-full btn-accent py-3"
              disabled={creating || txSend.isPending || !instructions.trim() || !amount || !token}
              onClick={handleCreate}
            >
              {creating || txSend.isPending ? 'Creating...' : 'Create Encrypted Task'}
            </button>
          </div>
        </div>
      </div>

        </>
      )}
    </motion.div>
  );
}
