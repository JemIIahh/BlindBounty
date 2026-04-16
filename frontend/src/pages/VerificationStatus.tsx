import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useVerificationStatus, useTriggerVerification } from '../hooks/useVerification';
import { Card, CardHeader, CardBody, Button, Input, Textarea } from '../components/ui';
import { VerificationBadge } from '../components/VerificationBadge';

export default function VerificationStatus() {
  const { isAuthenticated } = useAuth();
  const { data: status, isLoading } = useVerificationStatus();
  const triggerMutation = useTriggerVerification();

  const [taskId, setTaskId] = useState('');
  const [taskCategory, setTaskCategory] = useState('');
  const [taskRequirements, setTaskRequirements] = useState('');
  const [evidenceSummary, setEvidenceSummary] = useState('');

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
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-neutral-950 mb-6">Verification</h1>

      {/* System status */}
      {isLoading ? (
        <div className="text-sm text-neutral-400">Checking verification status...</div>
      ) : status && (
        <div className="mb-6 p-3 rounded-lg border border-neutral-200 bg-neutral-50 text-sm text-neutral-600">
          {status.message}
        </div>
      )}

      {/* Verification result */}
      {triggerMutation.data && (
        <Card className="mb-6">
          <CardHeader
            title="Verification Result"
            action={<VerificationBadge verified={triggerMutation.data.passed} />}
            bordered
          />
          <CardBody>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-neutral-500">Status</span>
                  <p className={triggerMutation.data.passed ? 'text-neutral-950 font-semibold' : 'text-neutral-500 font-semibold'}>
                    {triggerMutation.data.passed ? 'PASSED' : 'FAILED'}
                  </p>
                </div>
                <div>
                  <span className="text-neutral-500">Confidence</span>
                  <p className="text-neutral-950 font-semibold">{(triggerMutation.data.confidence * 100).toFixed(1)}%</p>
                </div>
                <div>
                  <span className="text-neutral-500">Model</span>
                  <p className="text-neutral-950">{triggerMutation.data.model}</p>
                </div>
                {triggerMutation.data.attestation && (
                  <div>
                    <span className="text-neutral-500">TEE Attestation</span>
                    <p className="text-xs text-neutral-400 font-mono truncate">{triggerMutation.data.attestation}</p>
                  </div>
                )}
              </div>

              {triggerMutation.data.reasoning && (
                <div>
                  <span className="text-sm text-neutral-500">Reasoning</span>
                  <p className="text-sm text-neutral-950 mt-1 whitespace-pre-wrap">{triggerMutation.data.reasoning}</p>
                </div>
              )}
            </div>
          </CardBody>
        </Card>
      )}

      {/* Trigger verification (authenticated users) */}
      {isAuthenticated && !triggerMutation.data && (
        <Card>
          <CardHeader title="Trigger Verification" bordered />
          <CardBody>
            <div className="space-y-4">
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
              <Button
                variant="primary"
                fullWidth
                loading={triggerMutation.isPending}
                disabled={!taskId || !taskCategory || !taskRequirements || !evidenceSummary}
                onClick={handleTrigger}
              >
                Trigger Sealed Verification
              </Button>
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
