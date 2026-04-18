import { authedGet, authedPost } from '../lib/api';

export interface CustodyEntry {
  id: number;
  task_id: string;
  evidence_hash: string;
  submitter: string;
  data_snapshot: string | null;
  created_at: string;
}

export interface AuditEvent {
  id: number;
  task_id: string;
  entry_id: number | null;
  action: string;
  actor: string;
  detail: string | null;
  created_at: string;
}

export interface IntegrityResult {
  valid: boolean;
  entries: { id: number; stored: string; computed: string; match: boolean }[];
}

export async function ingestEvidence(taskId: string, evidenceHash: string, dataSnapshot?: string) {
  return authedPost<CustodyEntry>('/api/v1/custody/ingest', { taskId, evidenceHash, dataSnapshot });
}

export async function getCustodyChain(taskId: string) {
  return authedGet<{ chain: CustodyEntry[] }>(`/api/v1/custody/${taskId}/chain`);
}

export async function verifyIntegrity(taskId: string) {
  return authedGet<IntegrityResult>(`/api/v1/custody/${taskId}/verify`);
}

export async function getAuditLog(taskId: string) {
  return authedGet<{ audit: AuditEvent[] }>(`/api/v1/custody/${taskId}/audit`);
}
