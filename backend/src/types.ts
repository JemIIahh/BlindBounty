import type { Request } from 'express';

/** Authenticated user attached by auth middleware */
export interface AuthUser {
  address: string;
}

/** Express request with authenticated user */
export interface AuthRequest extends Request {
  user?: AuthUser;
}

/** Standard API success response */
export interface ApiResponse<T = unknown> {
  success: true;
  data: T;
}

/** Standard API error response */
export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
  };
}

/** On-chain task status enum (mirrors BlindEscrow.TaskStatus) */
export enum TaskStatus {
  Funded = 0,
  Assigned = 1,
  Submitted = 2,
  Verified = 3,
  Completed = 4,
  Cancelled = 5,
  Disputed = 6,
}

/** On-chain task struct (mirrors BlindEscrow.Task) */
export interface OnChainTask {
  agent: string;
  worker: string;
  token: string;
  amount: bigint;
  taskHash: string;
  evidenceHash: string;
  status: TaskStatus;
  createdAt: bigint;
  deadline: bigint;
  submissionAttempts: number;
}

/** Task metadata from TaskRegistry */
export interface TaskMeta {
  taskId: bigint;
  agent: string;
  category: string;
  locationZone: string;
  reward: bigint;
  createdAt: bigint;
  isOpen: boolean;
}

/** Reputation from BlindReputation */
export interface Reputation {
  tasksCompleted: bigint;
  totalScore: bigint;
  disputes: bigint;
}

/** In-memory application record */
export interface Application {
  id: string;
  taskId: string;
  applicant: string;
  message?: string;
  createdAt: string;
}

// ── A2A (Agent-to-Agent) types ──────────────────────────────────────

export type ExecutorType = 'human' | 'agent';
export type VerificationMode = 'manual' | 'auto' | 'oracle';

export const AGENT_CAPABILITIES = [
  'data_processing', 'web_research', 'code_execution', 'content_generation',
  'api_integration', 'text_analysis', 'translation', 'summarization',
  'image_analysis', 'document_processing', 'math_computation', 'data_extraction',
  'report_generation', 'code_review', 'testing', 'scheduling',
  'email_drafting', 'social_media', 'market_research', 'competitive_analysis',
] as const;

export type AgentCapability = typeof AGENT_CAPABILITIES[number];

export interface AgentExecutor {
  address: string;
  displayName: string;
  capabilities: AgentCapability[];
  agentCardUrl?: string;
  mcpEndpointUrl?: string;
  reputation: number; // 0-100
  tasksCompleted: number;
  registeredAt: string;
}

export interface A2ATaskMeta {
  taskId: string;
  targetExecutorType: ExecutorType;
  verificationMode: VerificationMode;
  verificationCriteria?: VerificationCriteria;
  requiredCapabilities: AgentCapability[];
}

export type A2ATaskStateStatus =
  | 'open'
  | 'accepted'
  | 'in_progress'
  | 'submitted'
  | 'verified'
  | 'completed'
  | 'failed';

export interface A2ATaskState {
  taskId: string;
  status: A2ATaskStateStatus;
  executorAddress?: string;
  acceptedAt?: string;
  submittedAt?: string;
  resultData?: Record<string, unknown>;
  verificationResult?: { passed: boolean; reasons: string[] };
}

export interface VerificationCriteria {
  required_fields?: string[];
  min_length?: number;
  contains_keywords?: string[];
}
