import { useState } from 'react';
import { useCustodyChain, useAuditLog } from '../hooks/useCustody';
import { verifyIntegrity } from '../services/custody';
import type { IntegrityResult } from '../services/custody';
import { truncateAddress } from '../lib/utils';

const actionColors: Record<string, string> = {
  submitted: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  viewed: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  verified: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  exported: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  integrity_check: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
};

export function CustodyChain({ taskId }: { taskId: string }) {
  const { data: chainData, isLoading: chainLoading } = useCustodyChain(taskId);
  const { data: auditData, isLoading: auditLoading } = useAuditLog(taskId);
  const [integrityResult, setIntegrityResult] = useState<IntegrityResult | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [activeTab, setActiveTab] = useState<'chain' | 'audit'>('chain');

  const handleVerify = async () => {
    setVerifying(true);
    try {
      const result = await verifyIntegrity(taskId);
      setIntegrityResult(result);
    } catch (err) {
      console.error('Integrity check failed:', err);
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Tab selector */}
      <div className="flex gap-2 border-b border-neutral-800 pb-2">
        <button
          onClick={() => setActiveTab('chain')}
          className={`px-3 py-1.5 text-xs font-medium rounded-t transition-colors ${
            activeTab === 'chain'
              ? 'text-amber-400 border-b-2 border-amber-400'
              : 'text-neutral-500 hover:text-neutral-300'
          }`}
        >
          Evidence Chain
        </button>
        <button
          onClick={() => setActiveTab('audit')}
          className={`px-3 py-1.5 text-xs font-medium rounded-t transition-colors ${
            activeTab === 'audit'
              ? 'text-amber-400 border-b-2 border-amber-400'
              : 'text-neutral-500 hover:text-neutral-300'
          }`}
        >
          Audit Log
        </button>
      </div>

      {/* Verify Integrity button */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleVerify}
          disabled={verifying}
          className="px-3 py-1.5 text-xs font-medium rounded-lg border border-neutral-700 text-neutral-300 hover:border-neutral-500 hover:text-white transition-colors disabled:opacity-50"
        >
          {verifying ? 'Checking...' : 'Verify Integrity'}
        </button>
        {integrityResult && (
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${
            integrityResult.valid
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
              : 'bg-red-500/10 text-red-400 border-red-500/20'
          }`}>
            {integrityResult.valid ? 'PASS' : 'FAIL'}
          </span>
        )}
      </div>

      {/* Chain tab */}
      {activeTab === 'chain' && (
        <div className="relative">
          {chainLoading ? (
            <div className="text-sm text-neutral-500">Loading chain...</div>
          ) : !chainData?.chain?.length ? (
            <div className="text-sm text-neutral-500">No evidence entries yet.</div>
          ) : (
            <div className="space-y-0">
              {chainData.chain.map((entry, i) => (
                <div key={entry.id} className="flex gap-3">
                  {/* Timeline dots & line */}
                  <div className="flex flex-col items-center">
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-400 border-2 border-neutral-900 mt-1.5 z-10" />
                    {i < chainData.chain.length - 1 && (
                      <div className="w-px flex-1 bg-neutral-700" />
                    )}
                  </div>
                  {/* Entry card */}
                  <div className="flex-1 pb-4">
                    <div className="card-dark p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] text-neutral-500">
                          #{entry.id} &middot; {new Date(entry.created_at).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-300 font-mono break-all">
                        {entry.evidence_hash}
                      </p>
                      <p className="text-[10px] text-neutral-500 mt-1">
                        Submitter: {truncateAddress(entry.submitter)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Audit tab */}
      {activeTab === 'audit' && (
        <div>
          {auditLoading ? (
            <div className="text-sm text-neutral-500">Loading audit log...</div>
          ) : !auditData?.audit?.length ? (
            <div className="text-sm text-neutral-500">No audit events yet.</div>
          ) : (
            <div className="space-y-2">
              {auditData.audit.map((event) => (
                <div key={event.id} className="flex items-start gap-3 py-2">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                    actionColors[event.action] || 'bg-neutral-800 text-neutral-400 border-neutral-700'
                  }`}>
                    {event.action}
                  </span>
                  <div className="flex-1">
                    <p className="text-xs text-neutral-300">
                      {truncateAddress(event.actor)}
                    </p>
                    {event.detail && (
                      <p className="text-[10px] text-neutral-500 mt-0.5">{event.detail}</p>
                    )}
                  </div>
                  <span className="text-[10px] text-neutral-600">
                    {new Date(event.created_at).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
