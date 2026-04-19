import { describe, expect, it } from 'vitest';
import { generateAesKey } from '../src/crypto/index.js';
import { CryptoError } from '../src/errors/index.js';
import { InMemoryKeyStore } from '../src/keystore/index.js';
import type { Address, Hex, TaskKey } from '../src/types.js';

async function mkKey(): Promise<TaskKey> {
  return { aesKey: await generateAesKey(), createdAt: new Date() };
}

describe('InMemoryKeyStore', () => {
  it('round-trips task keys', async () => {
    const ks = new InMemoryKeyStore();
    const tk = await mkKey();
    await ks.putTaskKey(42n, tk);
    const got = await ks.getTaskKey(42n);
    expect(got).not.toBeNull();
    expect(got?.aesKey).toEqual(tk.aesKey);
    expect(got?.createdAt.getTime()).toBe(tk.createdAt.getTime());
  });

  it('returns null for missing task keys', async () => {
    const ks = new InMemoryKeyStore();
    expect(await ks.getTaskKey(999n)).toBeNull();
  });

  it('list enumerates stored task IDs', async () => {
    const ks = new InMemoryKeyStore();
    await ks.putTaskKey(1n, await mkKey());
    await ks.putTaskKey(2n, await mkKey());
    const all = await ks.list();
    expect(all.map((r) => r.taskId).sort()).toEqual([1n, 2n]);
  });

  it('delete removes a task key', async () => {
    const ks = new InMemoryKeyStore();
    await ks.putTaskKey(7n, await mkKey());
    await ks.delete(7n);
    expect(await ks.getTaskKey(7n)).toBeNull();
  });

  it('peer pubkey cache', async () => {
    const ks = new InMemoryKeyStore();
    const addr = '0x0000000000000000000000000000000000000001' as Address;
    const pub = ('0x04' + '11'.repeat(64)) as Hex;
    expect(await ks.getPeerPubKey(addr)).toBeNull();
    await ks.putPeerPubKey(addr, pub);
    expect(await ks.getPeerPubKey(addr)).toBe(pub);
  });

  it('returned AES key is a copy (mutations do not leak back)', async () => {
    const ks = new InMemoryKeyStore();
    await ks.putTaskKey(1n, await mkKey());
    const a = await ks.getTaskKey(1n);
    const b = await ks.getTaskKey(1n);
    // biome-ignore lint/style/noNonNullAssertion: returned by an earlier non-null assertion
    a!.aesKey[0] = (a!.aesKey[0]! ^ 0xff) & 0xff;
    expect(b?.aesKey).not.toEqual(a?.aesKey);
  });

  it('export/import round-trips with the same passphrase', async () => {
    const src = new InMemoryKeyStore();
    await src.putTaskKey(1n, await mkKey());
    await src.putTaskKey(2n, await mkKey());
    const addr = '0x0000000000000000000000000000000000000009' as Address;
    const pub = ('0x04' + 'ab'.repeat(64)) as Hex;
    await src.putPeerPubKey(addr, pub);

    const exported = await src.export('correct-horse-battery-staple');
    const dst = new InMemoryKeyStore();
    await dst.import(exported, 'correct-horse-battery-staple');

    const srcList = (await src.list()).map((r) => r.taskId).sort();
    const dstList = (await dst.list()).map((r) => r.taskId).sort();
    expect(dstList).toEqual(srcList);
    expect((await dst.getTaskKey(1n))?.aesKey).toEqual((await src.getTaskKey(1n))?.aesKey);
    expect(await dst.getPeerPubKey(addr)).toBe(pub);
  });

  it('import with wrong passphrase fails', async () => {
    const src = new InMemoryKeyStore();
    await src.putTaskKey(1n, await mkKey());
    const exported = await src.export('goodpassphrase');
    const dst = new InMemoryKeyStore();
    await expect(dst.import(exported, 'wrongpassphrase')).rejects.toBeInstanceOf(CryptoError);
  });

  it('export rejects short passphrases', async () => {
    const ks = new InMemoryKeyStore();
    await expect(ks.export('short')).rejects.toBeInstanceOf(CryptoError);
  });

  it('import rejects invalid JSON', async () => {
    const ks = new InMemoryKeyStore();
    await expect(ks.import('not-json', 'any-passphrase')).rejects.toBeInstanceOf(CryptoError);
  });

  it('import rejects unknown format', async () => {
    const ks = new InMemoryKeyStore();
    const fake = JSON.stringify({ format: 'other-format', salt: '00', blob: '00' });
    await expect(ks.import(fake, 'any-passphrase')).rejects.toBeInstanceOf(CryptoError);
  });
});
