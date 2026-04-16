import { authedGet, authedPost } from '../lib/api';
import type { UnsignedTx } from '../types/api';

export interface SubmissionInfo {
  taskId: number;
  evidenceHash: string;
  status: number;
  submissionAttempts: number;
}

export async function buildSubmitEvidence(params: {
  taskId: string;
  evidenceHash: string;
}): Promise<UnsignedTx> {
  // Backend expects POST /api/v1/submissions/submit with { taskId (number), evidenceHash }
  const res = await authedPost<{ unsignedTx: UnsignedTx }>('/api/v1/submissions/submit', {
    taskId: parseInt(params.taskId),
    evidenceHash: params.evidenceHash,
  });
  return res.unsignedTx;
}

export async function getSubmission(taskId: string): Promise<SubmissionInfo | null> {
  return authedGet<SubmissionInfo | null>(`/api/v1/submissions/${taskId}`);
}

export async function buildVerify(taskId: string, passed: boolean): Promise<UnsignedTx> {
  // Backend expects POST /api/v1/submissions/verify with { taskId (number), passed }
  const res = await authedPost<{ unsignedTx: UnsignedTx }>('/api/v1/submissions/verify', {
    taskId: parseInt(taskId),
    passed,
  });
  return res.unsignedTx;
}
