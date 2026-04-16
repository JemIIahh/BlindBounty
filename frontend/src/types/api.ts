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

export const TaskStatusLabels: Record<TaskStatus, string> = {
  [TaskStatus.Funded]: 'Funded',
  [TaskStatus.Assigned]: 'Assigned',
  [TaskStatus.Submitted]: 'Submitted',
  [TaskStatus.Verified]: 'Verified',
  [TaskStatus.Completed]: 'Completed',
  [TaskStatus.Cancelled]: 'Cancelled',
  [TaskStatus.Disputed]: 'Disputed',
};

/** On-chain task struct (mirrors BlindEscrow.Task) */
export interface OnChainTask {
  agent: string;
  worker: string;
  token: string;
  amount: string; // bigint serialized as string from API
  taskHash: string;
  evidenceHash: string;
  status: TaskStatus;
  createdAt: string;
  deadline: string;
  submissionAttempts: number;
}

/** Task metadata from TaskRegistry */
export interface TaskMeta {
  taskId: string;
  agent: string;
  category: string;
  locationZone: string;
  reward: string;
  createdAt: string;
  isOpen: boolean;
}

/** Reputation from BlindReputation */
export interface Reputation {
  tasksCompleted: string;
  totalScore: string;
  disputes: string;
}

/** In-memory application record */
export interface Application {
  id: string;
  taskId: string;
  applicant: string;
  message?: string;
  createdAt: string;
}

/** Combined task data for display */
export interface TaskDisplay {
  id: string;
  onChain: OnChainTask;
  meta: TaskMeta;
}

/** Unsigned transaction from backend */
export interface UnsignedTx {
  to: string;
  data: string;
  from: string;
}

/** Nonce response */
export interface NonceResponse {
  nonce: string;
}

/** Auth verify response */
export interface AuthVerifyResponse {
  token: string;
  expiresIn: string;
}

/** Verification result */
export interface VerificationResult {
  taskId: string;
  passed: boolean;
  confidence: number;
  reasoning: string;
  model: string;
  attestation?: string;
}
