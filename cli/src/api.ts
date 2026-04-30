import { loadConfig } from './config.js';

async function req<T>(method: string, path: string, body?: unknown, apiKey?: string): Promise<T> {
  const cfg = loadConfig();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const key = apiKey ?? cfg.apiKey;
  if (key) headers['Authorization'] = `Bearer ${key}`;

  const res = await fetch(`${cfg.apiBase}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json() as { success: boolean; data?: T; error?: { message: string } };
  if (!json.success) throw new Error(json.error?.message ?? `HTTP ${res.status}`);
  return json.data as T;
}

export const api = {
  post: <T>(path: string, body?: unknown, apiKey?: string) => req<T>('POST', path, body, apiKey),
  get:  <T>(path: string, apiKey?: string) => req<T>('GET', path, undefined, apiKey),
};
