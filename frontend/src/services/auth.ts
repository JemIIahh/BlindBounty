import { post } from '../lib/api';
import type { NonceResponse, AuthVerifyResponse } from '../types/api';

export async function postNonce(address: string): Promise<NonceResponse> {
  return post<NonceResponse>('/api/v1/auth/nonce', { address });
}

export async function postVerify(address: string, signature: string): Promise<AuthVerifyResponse> {
  return post<AuthVerifyResponse>('/api/v1/auth/verify', { address, signature });
}
