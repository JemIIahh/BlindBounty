import { API_BASE_URL } from '../config/constants';
import type { ApiResponse, ApiErrorResponse } from '../types/api';

class ApiError extends Error {
  constructor(public code: string, message: string, public status?: number) {
    super(message);
    this.name = 'ApiError';
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  const body = await res.json() as ApiResponse<T> | ApiErrorResponse;

  if (!res.ok || !body.success) {
    const err = body as ApiErrorResponse;
    throw new ApiError(
      err.error?.code || 'UNKNOWN',
      err.error?.message || `HTTP ${res.status}`,
      res.status,
    );
  }

  return (body as ApiResponse<T>).data;
}

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('bb_jwt');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
  });
  return handleResponse<T>(res);
}

export async function post<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  return handleResponse<T>(res);
}

export async function authedGet<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
  });
  return handleResponse<T>(res);
}

export async function authedPost<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: body ? JSON.stringify(body) : undefined,
  });
  return handleResponse<T>(res);
}

export { ApiError };
