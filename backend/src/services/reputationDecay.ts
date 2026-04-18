import { getDb } from './database.js';

const HALF_LIFE_DAYS = 7;

export interface DecayedReputation {
  address: string;
  rawScore: number;
  decayedScore: number;
  decayFactor: number;
  daysSinceLastTask: number | null;
  tasksCompleted: number;
  disputes: number;
}

export interface ReputationEvent {
  id: number;
  address: string;
  task_id: string;
  event_type: string;
  score_delta: number;
  created_at: string;
}

function computeDecayFactor(daysSinceLastTask: number | null): number {
  if (daysSinceLastTask === null) return 1;
  return Math.pow(0.5, daysSinceLastTask / HALF_LIFE_DAYS);
}

export function getDecayedReputation(address: string): DecayedReputation {
  const db = getDb();
  const row = db
    .prepare('SELECT * FROM reputation_history WHERE address = ?')
    .get(address) as { address: string; raw_score: number; tasks_completed: number; disputes: number; last_task_at: string | null } | undefined;

  if (!row) {
    return {
      address,
      rawScore: 0,
      decayedScore: 0,
      decayFactor: 1,
      daysSinceLastTask: null,
      tasksCompleted: 0,
      disputes: 0,
    };
  }

  let daysSinceLastTask: number | null = null;
  if (row.last_task_at) {
    const lastTaskDate = new Date(row.last_task_at);
    daysSinceLastTask = (Date.now() - lastTaskDate.getTime()) / (1000 * 60 * 60 * 24);
  }

  const decayFactor = computeDecayFactor(daysSinceLastTask);
  const decayedScore = row.raw_score * decayFactor;

  return {
    address,
    rawScore: row.raw_score,
    decayedScore: Math.round(decayedScore * 100) / 100,
    decayFactor: Math.round(decayFactor * 1000) / 1000,
    daysSinceLastTask: daysSinceLastTask !== null ? Math.round(daysSinceLastTask * 10) / 10 : null,
    tasksCompleted: row.tasks_completed,
    disputes: row.disputes,
  };
}

export function recordTaskCompletion(address: string, taskId: string, scoreDelta: number): void {
  const db = getDb();
  const now = new Date().toISOString();

  const existing = db.prepare('SELECT * FROM reputation_history WHERE address = ?').get(address);
  if (existing) {
    db.prepare(
      'UPDATE reputation_history SET raw_score = raw_score + ?, tasks_completed = tasks_completed + 1, last_task_at = ? WHERE address = ?',
    ).run(scoreDelta, now, address);
  } else {
    db.prepare(
      'INSERT INTO reputation_history (address, raw_score, tasks_completed, last_task_at) VALUES (?, ?, 1, ?)',
    ).run(address, scoreDelta, now);
  }

  db.prepare(
    'INSERT INTO reputation_events (address, task_id, event_type, score_delta) VALUES (?, ?, ?, ?)',
  ).run(address, taskId, 'task_completed', scoreDelta);
}

export function recordDispute(address: string, taskId: string): void {
  const db = getDb();

  const existing = db.prepare('SELECT * FROM reputation_history WHERE address = ?').get(address);
  if (existing) {
    db.prepare('UPDATE reputation_history SET disputes = disputes + 1 WHERE address = ?').run(address);
  } else {
    db.prepare(
      'INSERT INTO reputation_history (address, raw_score, disputes) VALUES (?, 0, 1)',
    ).run(address);
  }

  db.prepare(
    'INSERT INTO reputation_events (address, task_id, event_type, score_delta) VALUES (?, ?, ?, ?)',
  ).run(address, taskId, 'dispute', 0);
}

export function getLeaderboard(limit: number = 20): DecayedReputation[] {
  const db = getDb();
  const rows = db
    .prepare('SELECT * FROM reputation_history ORDER BY raw_score DESC LIMIT ?')
    .all(limit) as { address: string; raw_score: number; tasks_completed: number; disputes: number; last_task_at: string | null }[];

  return rows.map((row) => {
    let daysSinceLastTask: number | null = null;
    if (row.last_task_at) {
      daysSinceLastTask = (Date.now() - new Date(row.last_task_at).getTime()) / (1000 * 60 * 60 * 24);
    }
    const decayFactor = computeDecayFactor(daysSinceLastTask);
    return {
      address: row.address,
      rawScore: row.raw_score,
      decayedScore: Math.round(row.raw_score * decayFactor * 100) / 100,
      decayFactor: Math.round(decayFactor * 1000) / 1000,
      daysSinceLastTask: daysSinceLastTask !== null ? Math.round(daysSinceLastTask * 10) / 10 : null,
      tasksCompleted: row.tasks_completed,
      disputes: row.disputes,
    };
  }).sort((a, b) => b.decayedScore - a.decayedScore);
}

export function getReputationHistory(address: string, limit: number = 100): ReputationEvent[] {
  const db = getDb();
  return db
    .prepare('SELECT * FROM reputation_events WHERE address = ? ORDER BY created_at DESC LIMIT ?')
    .all(address, limit) as ReputationEvent[];
}
