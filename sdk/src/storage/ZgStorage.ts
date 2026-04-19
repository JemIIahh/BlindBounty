import { Indexer, MemData } from '@0gfoundation/0g-ts-sdk';
import type { ethers } from 'ethers';
import { StorageError } from '../errors/index.js';
import type { RootHash, UploadResult } from '../types.js';
import type { Storage } from './Storage.js';

export interface ZgStorageOptions {
  /** 0G Storage indexer URL, e.g. 'https://indexer-storage-testnet-turbo.0g.ai'. */
  indexerUrl: string;
  /** 0G chain RPC URL — passed to the indexer for upload fee submission. */
  rpcUrl: string;
  /** Wallet used to pay for uploads. Reads don't require a signer. */
  signer?: ethers.Signer;
}

/**
 * Node-only adapter over @0gfoundation/0g-ts-sdk. Browser consumers must
 * provide their own Storage adapter (IPFS, custom server-side proxy, etc.)
 * because the 0G TS SDK uses Node-specific filesystem APIs for downloads.
 */
export class ZgStorage implements Storage {
  private readonly indexer: Indexer;
  private readonly opts: ZgStorageOptions;

  constructor(opts: ZgStorageOptions) {
    this.opts = opts;
    this.indexer = new Indexer(opts.indexerUrl);
  }

  async upload(bytes: Uint8Array): Promise<UploadResult> {
    if (!this.opts.signer) {
      throw new StorageError('STORAGE/UPLOAD_FAILED', 'signer required for uploads');
    }
    const memData = new MemData(copy(bytes));
    const [tree, treeErr] = await memData.merkleTree();
    if (treeErr !== null || !tree) {
      throw new StorageError('STORAGE/UPLOAD_FAILED', 'merkle tree computation failed', { cause: treeErr ?? undefined });
    }
    const rootHash = tree.rootHash() as RootHash;

    let txHash: string | undefined;
    try {
      // The 0G SDK's Signer types are pinned to a specific ethers minor version
      // that may not match the host project's. Runtime is compatible; the cast
      // avoids false-negative type errors across ethers versions.
      // biome-ignore lint/suspicious/noExplicitAny: see comment above
      const [tx, uploadErr] = await this.indexer.upload(memData, this.opts.rpcUrl, this.opts.signer as any);
      if (uploadErr !== null) {
        throw new StorageError('STORAGE/UPLOAD_FAILED', 'indexer upload failed', {
          cause: uploadErr,
          retriable: true,
        });
      }
      const maybe = tx as { txHash?: string } | null;
      txHash = maybe?.txHash;
    } catch (err) {
      if (err instanceof StorageError) throw err;
      throw new StorageError('STORAGE/UPLOAD_FAILED', 'unexpected upload error', {
        cause: err,
        retriable: true,
      });
    }

    return {
      rootHash,
      ...(txHash ? { txHash: txHash as `0x${string}` } : {}),
      size: bytes.byteLength,
    };
  }

  async download(rootHash: RootHash): Promise<Uint8Array> {
    // 0G SDK downloads to a filesystem path. We write to a tmp file, read bytes back,
    // and delete the tmp file regardless of success/failure.
    const [nodeFs, nodePath, nodeOs, nodeCrypto] = await loadNodeFs();
    const rand = nodeCrypto.randomBytes(8).toString('hex');
    const tmp = nodePath.join(nodeOs.tmpdir(), `0g-${rootHash.replace(/^0x/, '')}-${rand}`);
    try {
      const err = await this.indexer.download(rootHash, tmp, true);
      if (err !== null) {
        throw new StorageError('STORAGE/NOT_FOUND', `no blob at ${rootHash}`, {
          cause: err,
          retriable: true,
        });
      }
      return new Uint8Array(nodeFs.readFileSync(tmp));
    } finally {
      try {
        nodeFs.unlinkSync(tmp);
      } catch {
        // ignore cleanup errors
      }
    }
  }

  async hash(bytes: Uint8Array): Promise<RootHash> {
    const memData = new MemData(copy(bytes));
    const [tree, err] = await memData.merkleTree();
    if (err !== null || !tree) {
      throw new StorageError('STORAGE/UPLOAD_FAILED', 'merkle tree computation failed', { cause: err ?? undefined });
    }
    return tree.rootHash() as RootHash;
  }
}

function copy(u: Uint8Array): Uint8Array {
  const c = new Uint8Array(u.byteLength);
  c.set(u);
  return c;
}

type NodeFs = { readFileSync: (p: string) => Buffer; unlinkSync: (p: string) => void };
type NodePath = { join: (...p: string[]) => string };
type NodeOs = { tmpdir: () => string };
type NodeCrypto = { randomBytes: (n: number) => { toString: (enc: 'hex') => string } };

async function loadNodeFs(): Promise<[NodeFs, NodePath, NodeOs, NodeCrypto]> {
  const [fs, path, os, crypto] = await Promise.all([
    import('node:fs'),
    import('node:path'),
    import('node:os'),
    import('node:crypto'),
  ]);
  return [fs as unknown as NodeFs, path as unknown as NodePath, os as unknown as NodeOs, crypto as unknown as NodeCrypto];
}
