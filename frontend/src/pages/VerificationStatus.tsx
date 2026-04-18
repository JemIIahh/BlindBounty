import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useVerificationStatus, useTriggerVerification } from '../hooks/useVerification';
import { Input, Textarea } from '../components/ui';
import { VerificationBadge } from '../components/VerificationBadge';
import { ForensicResults } from '../components/ForensicResults';
import { getForensicReport, type ForensicReportResponse } from '../services/forensics';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export default function VerificationStatus() {
  const { isAuthenticated } = useAuth();
  const { data: status, isLoading } = useVerificationStatus();
  const triggerMutation = useTriggerVerification();

  const [forensicData, setForensicData] = useState<ForensicReportResponse | null>(null);

  const [taskId, setTaskId] = useState('');
  const [taskCategory, setTaskCategory] = useState('');
  const [taskRequirements, setTaskRequirements] = useState('');
  const [evidenceSummary, setEvidenceSummary] = useState('');

  useEffect(() => {
    if (taskId) {
      getForensicReport(taskId).then(setForensicData).catch(() => setForensicData(null));
    }
  }, [taskId]);

  const handleTrigger = () => {
    if (!taskId || !taskCategory || !taskRequirements || !evidenceSummary) return;
    triggerMutation.mutate({
      taskId: parseInt(taskId),
      taskCategory,
      taskRequirements,
      evidenceSummary,
    });
  };

  return (
    <motion.div initial="hidden" animate="visible" variants={fadeUp} className="max-w-2xl mx-auto">
      <div className="mb-10">
        <h1 className="heading-display text-3xl sm:text-4xl mb-2">Verification</h1>
        <p className="text-sm text-neutral-500">TEE-powered evidence verification</p>
      </div>

      {/* System status */}
      {isLoading ? (
        <div className="text-sm text-neutral-600">Checking verification status...</div>
      ) : status && (
        <div className="mb-6 card-dark p-4 text-sm text-neutral-400">
          {status.message}
        </div>
      )}

      {/* Forensic analysis */}
      {forensicData && (
        <div className="mb-6">
          <ForensicResults validation={forensicData.validation} />
        </div>
      )}

      {/* Verification result */}
      {triggerMutation.data && (
        <div className={`mb-6 rounded-xl border overflow-hidden ${
          triggerMutation.data.passed
            ? 'border-emerald-500/20 bg-emerald-500/5'
            : 'border-red-500/20 bg-red-500/5'
        }`}>
          <div className="px-6 py-4 border-b border-inherit flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">Verification Result</h2>
            <VerificationBadge verified={triggerMutation.data.passed} />
          </div>
          <div className="px-6 py-5">
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <span className="text-[10px] text-neutral-600 uppercase tracking-wider">Status</span>
                  <p className={`text-xl font-bold mt-1 ${triggerMutation.data.passed ? 'text-emerald-400' : 'text-red-400'}`}>
                    {triggerMutation.data.passed ? 'PASSED' : 'FAILED'}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] text-neutral-600 uppercase tracking-wider">Confidence</span>
                  <p className="text-2xl font-bold text-white mt-1">{(triggerMutation.data.confidence * 100).toFixed(1)}%</p>
                </div>
                <div>
                  <span className="text-[10px] text-neutral-600 uppercase tracking-wider">Model</span>
                  <p className="text-sm text-neutral-300 font-mono mt-1">{triggerMutation.data.model}</p>
                </div>
                {triggerMutation.data.attestation && (
                  <div>
                    <span className="text-[10px] text-neutral-600 uppercase tracking-wider">TEE Attestation</span>
                    <div className="mt-1">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                        TEE Verified
                      </span>
                    </div>
                    <p className="text-xs text-neutral-600 font-mono truncate mt-1">{triggerMutation.data.attestation}</p>
                  </div>
                )}
              </div>

              {triggerMutation.data.reasoning && (
                <div>
                  <span className="text-[10px] text-neutral-600 uppercase tracking-wider">Reasoning</span>
                  <p className="text-sm text-neutral-300 mt-1 whitespace-pre-wrap leading-relaxed">{triggerMutation.data.reasoning}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Loading state */}
      {triggerMutation.isPending && (
        <div className="mb-6 card-dark p-10 text-center border-amber-500/20">
          <div className="inline-flex items-center gap-3">
            <svg className="animate-spin w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span className="text-sm font-medium text-amber-400">Verifying in TEE enclave...</span>
          </div>
        </div>
      )}

      {/* Trigger verification */}
      {isAuthenticated && !triggerMutation.data && !triggerMutation.isPending && (
        <div className="card-dark overflow-hidden">
          <div className="px-6 py-4 border-b border-neutral-800">
            <h2 className="text-sm font-semibold text-white">Trigger Verification</h2>
          </div>
          <div className="px-6 py-6">
            <div className="space-y-5">
              <p className="text-sm text-neutral-500">
                As the agent, provide the task details and evidence summary to trigger TEE verification.
              </p>
              <Input
                label="Task ID"
                placeholder="e.g., 1"
                value={taskId}
                onChange={(e) => setTaskId(e.target.value)}
              />
              <Input
                label="Task Category"
                placeholder="e.g., simple_action"
                value={taskCategory}
                onChange={(e) => setTaskCategory(e.target.value)}
              />
              <Textarea
                label="Task Requirements"
                placeholder="What was the worker asked to do?"
                value={taskRequirements}
                onChange={(e) => setTaskRequirements(e.target.value)}
                rows={3}
              />
              <Textarea
                label="Evidence Summary"
                placeholder="Summary of the worker's submitted evidence..."
                value={evidenceSummary}
                onChange={(e) => setEvidenceSummary(e.target.value)}
                rows={4}
              />
              <button
                className="w-full btn-accent py-3"
                disabled={!taskId || !taskCategory || !taskRequirements || !evidenceSummary}
                onClick={handleTrigger}
              >
                Trigger Sealed Verification
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
