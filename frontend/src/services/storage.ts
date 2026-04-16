import { authedPost, authedGet } from '../lib/api';

export interface UploadResult {
  rootHash: string;
  txHash?: string;
}

export async function uploadBlob(data: string): Promise<UploadResult> {
  return authedPost<UploadResult>('/api/v1/storage/upload', { data });
}

export async function downloadBlob(rootHash: string): Promise<{ data: string }> {
  // Backend returns { rootHash, blob } — map blob to data for frontend consistency
  const res = await authedGet<{ rootHash: string; blob: string }>(`/api/v1/storage/${rootHash}`);
  return { data: res.blob };
}
