import { describe, expect, it } from 'vitest';
import { StorageError } from '../src/errors/index.js';
import { MemoryStorage } from '../src/storage/index.js';

describe('MemoryStorage', () => {
  it('upload returns deterministic root hash for the same bytes', async () => {
    const s = new MemoryStorage();
    const bytes = new TextEncoder().encode('hello');
    const a = await s.upload(bytes);
    const b = await s.upload(bytes);
    expect(a.rootHash).toBe(b.rootHash);
    expect(a.size).toBe(5);
    expect(s.size()).toBe(1);
  });

  it('download returns the uploaded bytes', async () => {
    const s = new MemoryStorage();
    const bytes = new TextEncoder().encode('payload');
    const { rootHash } = await s.upload(bytes);
    const got = await s.download(rootHash);
    expect(new TextDecoder().decode(got)).toBe('payload');
  });

  it('download of unknown hash throws STORAGE/NOT_FOUND', async () => {
    const s = new MemoryStorage();
    await expect(s.download('0x' + '00'.repeat(32) as `0x${string}`)).rejects.toBeInstanceOf(StorageError);
  });

  it('hash is content-addressed and matches SHA-256', async () => {
    const s = new MemoryStorage();
    const h = await s.hash(new TextEncoder().encode('abc'));
    // Known vector for SHA-256('abc')
    expect(h).toBe('0xba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  });

  it('returned bytes are a copy (mutation does not affect stored blob)', async () => {
    const s = new MemoryStorage();
    const bytes = new TextEncoder().encode('one');
    const { rootHash } = await s.upload(bytes);
    const a = await s.download(rootHash);
    // biome-ignore lint/style/noNonNullAssertion: non-empty
    a[0] = (a[0]! ^ 0xff) & 0xff;
    const b = await s.download(rootHash);
    expect(b[0]).not.toBe(a[0]);
    expect(new TextDecoder().decode(b)).toBe('one');
  });

  it('clear wipes all blobs', async () => {
    const s = new MemoryStorage();
    await s.upload(new Uint8Array([1]));
    expect(s.size()).toBe(1);
    s.clear();
    expect(s.size()).toBe(0);
  });
});
