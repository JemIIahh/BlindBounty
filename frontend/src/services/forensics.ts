import { authedPost, authedGet } from '../lib/api';
import type { SignedForensicReport, ForensicValidation } from '../lib/forensicTypes';

export interface ForensicSubmitResponse {
  overallScore: number;
  passed: boolean;
  checks: Array<{ name: string; passed: boolean; severity: string; detail: string }>;
  flags: string[];
}

export async function submitForensicReport(
  taskId: string,
  signedReport: SignedForensicReport,
): Promise<ForensicSubmitResponse> {
  return authedPost<ForensicSubmitResponse>('/api/v1/forensics/submit', {
    taskId,
    signedReport,
  });
}

export interface ForensicReportResponse {
  signedReport: SignedForensicReport;
  validation: ForensicValidation;
}

export async function getForensicReport(taskId: string): Promise<ForensicReportResponse | null> {
  try {
    return await authedGet<ForensicReportResponse>(`/api/v1/forensics/${taskId}`);
  } catch {
    return null;
  }
}
