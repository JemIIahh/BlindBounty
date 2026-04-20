import type { RootHash, UploadResult } from '../types.js';

/**
 * Abstraction over blob storage. Default implementation (ZgStorage) uses
 * 0G Storage; MemoryStorage is for tests and local fallback. Consumers can
 * provide their own adapter for IPFS, S3, etc.
 */
export interface Storage {
  /** Upload bytes, return root hash + optional tx hash + size. */
  upload(bytes: Uint8Array): Promise<UploadResult>;
  /** Download bytes by root hash. Throws StorageError('STORAGE/NOT_FOUND') if absent. */
  download(rootHash: RootHash): Promise<Uint8Array>;
  /** Compute the canonical root hash without uploading. */
  hash(bytes: Uint8Array): Promise<RootHash>;
}
