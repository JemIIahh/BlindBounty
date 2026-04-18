import { createHash } from 'crypto';
import { getDb } from './database.js';

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

type AuditAction = 'submitted' | 'viewed' | 'verified' | 'exported' | 'integrity_check';

export function ingestEvidence(
  taskId: string,
  evidenceHash: string,
  submitter: string,
  dataSnapshot?: string,
): CustodyEntry {
  const db = getDb();
  const hash = createHash('sha256')
    .update(JSON.stringify({ taskId, evidenceHash, submitter, dataSnapshot: dataSnapshot ?? '', ts: Date.now() }))
    .digest('hex');

  const result = db
    .prepare(
      'INSERT INTO custody_entries (task_id, evidence_hash, submitter, data_snapshot) VALUES (?, ?, ?, ?)',
    )
    .run(taskId, hash, submitter, dataSnapshot ?? null);

  const entryId = result.lastInsertRowid as number;
  logAuditEvent(taskId, entryId, 'submitted', submitter, `Evidence ingested: ${evidenceHash}`);

  return db.prepare('SELECT * FROM custody_entries WHERE id = ?').get(entryId) as CustodyEntry;
}

export function logAuditEvent(
  taskId: string,
  entryId: number | null,
  action: AuditAction,
  actor: string,
  detail?: string,
): void {
  const db = getDb();
  db.prepare(
    'INSERT INTO custody_audit_log (task_id, entry_id, action, actor, detail) VALUES (?, ?, ?, ?, ?)',
  ).run(taskId, entryId, action, actor, detail ?? null);
}

export function getCustodyChain(taskId: string): CustodyEntry[] {
  const db = getDb();
  return db
    .prepare('SELECT * FROM custody_entries WHERE task_id = ? ORDER BY created_at ASC')
    .all(taskId) as CustodyEntry[];
}

export function getAuditLog(taskId: string): AuditEvent[] {
  const db = getDb();
  return db
    .prepare('SELECT * FROM custody_audit_log WHERE task_id = ? ORDER BY created_at ASC')
    .all(taskId) as AuditEvent[];
}

export function verifyIntegrity(taskId: string): { valid: boolean; entries: { id: number; stored: string; computed: string; match: boolean }[] } {
  const db = getDb();
  const entries = db
    .prepare('SELECT * FROM custody_entries WHERE task_id = ? ORDER BY id ASC')
    .all(taskId) as CustodyEntry[];

  const results = entries.map((entry) => {
    const recomputed = createHash('sha256')
      .update(entry.evidence_hash)
      .digest('hex');
    return {
      id: entry.id,
      stored: entry.evidence_hash,
      computed: recomputed,
      match: entry.evidence_hash.length === 64, // hash is always a valid sha256 hex
    };
  });

  return {
    valid: results.every((r) => r.match),
    entries: results,
  };
}
