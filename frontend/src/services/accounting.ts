import { authedGet } from '../lib/api';
import { API_BASE_URL } from '../config/constants';

export interface Transaction {
  id: number;
  address: string;
  role: string;
  task_id: string | null;
  type: string;
  amount: number;
  fee: number;
  net: number;
  status: string;
  tx_hash: string | null;
  created_at: string;
}

export interface TransactionSummary {
  totalEarned: number;
  totalFees: number;
  netRevenue: number;
  taskCount: number;
}

export async function getEntries(from?: string, to?: string, type?: string) {
  const params = new URLSearchParams();
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  if (type) params.set('type', type);
  const qs = params.toString();
  return authedGet<{ transactions: Transaction[]; total: number }>(`/api/v1/accounting/entries${qs ? `?${qs}` : ''}`);
}

export async function getSummary(from?: string, to?: string) {
  const params = new URLSearchParams();
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  const qs = params.toString();
  return authedGet<TransactionSummary>(`/api/v1/accounting/summary${qs ? `?${qs}` : ''}`);
}

export function buildExportUrl(format: 'csv' | 'json', from?: string, to?: string): string {
  const params = new URLSearchParams({ format });
  if (from) params.set('from', from);
  if (to) params.set('to', to);
  return `${API_BASE_URL}/api/v1/accounting/export?${params.toString()}`;
}
