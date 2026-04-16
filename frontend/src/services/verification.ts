import { authedPost, get } from '../lib/api';
import type { VerificationResult } from '../types/api';

export interface VerificationProvider {
  id: string;
  name: string;
  model: string;
}

export interface VerificationInput {
  taskId: number;
  taskCategory: string;
  taskRequirements: string;
  evidenceSummary: string;
}

export async function triggerVerification(params: VerificationInput): Promise<VerificationResult> {
  return authedPost<VerificationResult>('/api/v1/verification/verify', params);
}

export async function getProviders(): Promise<VerificationProvider[]> {
  return authedPost<VerificationProvider[]>('/api/v1/verification/providers', {});
}

export async function getVerificationStatus(): Promise<{ configured: boolean; message: string }> {
  return get<{ configured: boolean; message: string }>('/api/v1/verification/status');
}
