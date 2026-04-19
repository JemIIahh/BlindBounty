import type { Address, Hex, TaskId, TaskKey, TaskKeyRef } from '../types.js';

/**
 * Per-session storage for task AES keys and cached peer public keys. The SDK
 * never logs or serializes anything from here — this is the one place at-rest
 * secrets live. Implementations MUST treat passphrase-protected exports as the
 * only portable format.
 */
export interface KeyStore {
  putTaskKey(taskId: TaskId, key: TaskKey): Promise<void>;
  getTaskKey(taskId: TaskId): Promise<TaskKey | null>;
  putPeerPubKey(addr: Address, pubkey: Hex): Promise<void>;
  getPeerPubKey(addr: Address): Promise<Hex | null>;
  list(): Promise<TaskKeyRef[]>;
  delete(taskId: TaskId): Promise<void>;
  /** Portable, encrypted-at-rest JSON export for backup/migration. */
  export(passphrase: string): Promise<string>;
  import(data: string, passphrase: string): Promise<void>;
}
