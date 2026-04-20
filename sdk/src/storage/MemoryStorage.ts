import { sha256 } from '../crypto/index.js';
import { StorageError } from '../errors/index.js';
import type { RootHash, UploadResult } from '../types.js';
import type { Storage } from './Storage.js';

/**
 * In-process Storage for tests and local development. Deterministic: rootHash
 * is the SHA-256 of the content (not a merkle root), so the same bytes always
 * produce the same hash. Not for production — no replication, no integrity
 * proofs beyond SHA-256.
 */
export class MemoryStorage implements Storage {
  private readonly blobs = new Map<string, Uint8Array>();

  async upload(bytes: Uint8Array): Promise<UploadResult> {
    const rootHash = await this.hash(bytes);
    this.blobs.set(rootHash, copy(bytes));
    return { rootHash, size: bytes.byteLength };
  }

  async download(rootHash: RootHash): Promise<Uint8Array> {
    const data = this.blobs.get(rootHash);
    if (!data) {
      throw new StorageError('STORAGE/NOT_FOUND', `no blob at ${rootHash}`);
    }
    return copy(data);
  }

  async hash(bytes: Uint8Array): Promise<RootHash> {
    const digest = await sha256(bytes);
    return ('0x' + Array.from(digest, (b) => b.toString(16).padStart(2, '0')).join('')) as RootHash;
  }

  /** Test helper: wipe all stored blobs. */
  clear(): void {
    this.blobs.clear();
  }

  /** Test helper: count of stored blobs. */
  size(): number {
    return this.blobs.size;
  }
}

function copy(u: Uint8Array): Uint8Array {
  const c = new Uint8Array(u.byteLength);
  c.set(u);
  return c;
}
