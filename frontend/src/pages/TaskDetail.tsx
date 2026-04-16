import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTask, useApplications, useApplyToTask } from '../hooks/useTasks';
import { useTxSend } from '../hooks/useTxSend';
import { useWallet } from '../context/WalletContext';
import { useAuth } from '../context/AuthContext';
import { StatusBadge } from '../components/ui/StatusBadge';
import { Card, CardBody, CardHeader, Button, Textarea, Skeleton } from '../components/ui';
import { EncryptionIndicator } from '../components/EncryptionIndicator';
import { TxPendingModal } from '../components/TxPendingModal';
import { truncateAddress, formatCurrency, formatDate } from '../lib/utils';
import { buildAssignTask, buildCancelTask } from '../services/tasks';
import { TaskStatus } from '../types/api';

export default function TaskDetail() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading } = useTask(id);
  const { data: applications } = useApplications(id);
  const { address } = useWallet();
  const { isAuthenticated } = useAuth();
  const applyMutation = useApplyToTask();
  const txSend = useTxSend();
  const [applyMessage, setApplyMessage] = useState('');
  const [showApplyForm, setShowApplyForm] = useState(false);

  if (isLoading || !data) {
    return (
      <div className="max-w-3xl mx-auto space-y-4">
        <Skeleton height={40} width="60%" />
        <Skeleton height={200} />
        <Skeleton height={150} />
      </div>
    );
  }

  const { onChain, meta } = data;
  const isAgent = address?.toLowerCase() === onChain.agent.toLowerCase();
  const isWorker = address?.toLowerCase() === onChain.worker.toLowerCase();
  const reward = Number(meta.reward) / 1e18;

  const handleApply = () => {
    if (!id) return;
    applyMutation.mutate({ taskId: id, message: applyMessage || undefined });
    setShowApplyForm(false);
    setApplyMessage('');
  };

  const handleAssign = async (worker: string) => {
    if (!id) return;
    const unsignedTx = await buildAssignTask(id, worker);
    txSend.mutate(unsignedTx);
  };

  const handleCancel = async () => {
    if (!id) return;
    const unsignedTx = await buildCancelTask(id);
    txSend.mutate(unsignedTx);
  };

  return (
    <div className="max-w-3xl mx-auto">
      <TxPendingModal open={txSend.isPending} />

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold text-neutral-950">Task #{id}</h1>
            <StatusBadge status={onChain.status} showDot />
          </div>
          <div className="flex items-center gap-4 text-sm text-neutral-400">
            <span>{meta.category.replace('_', ' ')}</span>
            <span>{meta.locationZone || 'Global'}</span>
            <EncryptionIndicator encrypted={true} />
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-neutral-950">{formatCurrency(reward)}</div>
          <div className="text-xs text-neutral-500">Escrow Locked</div>
        </div>
      </div>

      {/* Details */}
      <Card className="mb-6">
        <CardHeader title="Task Details" bordered />
        <CardBody>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-neutral-500">Agent</span>
              <p className="text-neutral-950 font-mono">{truncateAddress(onChain.agent)}</p>
            </div>
            <div>
              <span className="text-neutral-500">Worker</span>
              <p className="text-neutral-950 font-mono">
                {onChain.worker === '0x0000000000000000000000000000000000000000'
                  ? 'Unassigned'
                  : truncateAddress(onChain.worker)}
              </p>
            </div>
            <div>
              <span className="text-neutral-500">Created</span>
              <p className="text-neutral-950">{formatDate(new Date(Number(onChain.createdAt) * 1000))}</p>
            </div>
            <div>
              <span className="text-neutral-500">Deadline</span>
              <p className="text-neutral-950">{formatDate(new Date(Number(onChain.deadline) * 1000))}</p>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Worker: Apply section */}
      {isAuthenticated && !isAgent && onChain.status === TaskStatus.Funded && (
        <Card className="mb-6">
          <CardHeader title="Apply for this Task" bordered />
          <CardBody>
            {showApplyForm ? (
              <div className="space-y-4">
                <Textarea
                  label="Application Message (optional)"
                  placeholder="Why are you a good fit for this task?"
                  value={applyMessage}
                  onChange={(e) => setApplyMessage(e.target.value)}
                  rows={3}
                />
                <div className="flex gap-2">
                  <Button
                    variant="primary"
                    size="sm"
                    loading={applyMutation.isPending}
                    onClick={handleApply}
                  >
                    Submit Application
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setShowApplyForm(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <Button variant="primary" size="sm" onClick={() => setShowApplyForm(true)}>
                Apply
              </Button>
            )}
          </CardBody>
        </Card>
      )}

      {/* Agent: Applications list + Assign */}
      {isAgent && applications && applications.length > 0 && (
        <Card className="mb-6">
          <CardHeader title={`Applications (${applications.length})`} bordered />
          <CardBody padding="none">
            {applications.map((app) => (
              <div
                key={app.id}
                className="flex items-center justify-between px-6 py-3 border-b border-neutral-200 last:border-0"
              >
                <div>
                  <p className="text-sm text-neutral-950 font-mono">{truncateAddress(app.applicant)}</p>
                  {app.message && (
                    <p className="text-xs text-neutral-400 mt-0.5">{app.message}</p>
                  )}
                </div>
                {onChain.status === TaskStatus.Funded && (
                  <Button
                    variant="primary"
                    size="xs"
                    onClick={() => handleAssign(app.applicant)}
                    loading={txSend.isPending}
                  >
                    Assign
                  </Button>
                )}
              </div>
            ))}
          </CardBody>
        </Card>
      )}

      {/* Agent: Cancel */}
      {isAgent && onChain.status === TaskStatus.Funded && (
        <div className="flex justify-end">
          <Button variant="danger" size="sm" onClick={handleCancel} loading={txSend.isPending}>
            Cancel Task & Refund
          </Button>
        </div>
      )}

      {/* Worker: Already assigned */}
      {isWorker && onChain.status === TaskStatus.Assigned && (
        <Card className="mb-6">
          <CardBody>
            <div className="text-center py-4">
              <p className="text-neutral-950 font-semibold mb-2">You are assigned to this task</p>
              <p className="text-sm text-neutral-400">Go to your Worker Dashboard to decrypt instructions and submit evidence.</p>
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
