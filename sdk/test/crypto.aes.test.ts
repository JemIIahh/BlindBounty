import * as fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { aesDecrypt, aesEncrypt, generateAesKey, sha256 } from '../src/crypto/index.js';
import { CryptoError } from '../src/errors/index.js';

describe('aes-256-gcm', () => {
  it('encrypts then decrypts arbitrary bytes', async () => {
    const key = await generateAesKey();
    const pt = new TextEncoder().encode('hello bounty');
    const ct = await aesEncrypt(pt, key);
    expect(ct.byteLength).toBe(pt.byteLength + 12 + 16);
    const rt = await aesDecrypt(ct, key);
    expect(new TextDecoder().decode(rt)).toBe('hello bounty');
  });

  it('generates distinct keys each call', async () => {
    const a = await generateAesKey();
    const b = await generateAesKey();
    expect(a.byteLength).toBe(32);
    expect(b.byteLength).toBe(32);
    expect(a).not.toEqual(b);
  });

  it('emits distinct ciphertexts for the same plaintext+key (random IV)', async () => {
    const key = await generateAesKey();
    const pt = new TextEncoder().encode('same text');
    const c1 = await aesEncrypt(pt, key);
    const c2 = await aesEncrypt(pt, key);
    expect(c1).not.toEqual(c2);
  });

  it('rejects non-32-byte keys on encrypt', async () => {
    const key = new Uint8Array(16);
    await expect(aesEncrypt(new Uint8Array(4), key)).rejects.toBeInstanceOf(CryptoError);
  });

  it('rejects non-32-byte keys on decrypt', async () => {
    const key = new Uint8Array(16);
    await expect(aesDecrypt(new Uint8Array(32), key)).rejects.toBeInstanceOf(CryptoError);
  });

  it('rejects truncated blobs', async () => {
    const key = await generateAesKey();
    await expect(aesDecrypt(new Uint8Array(10), key)).rejects.toBeInstanceOf(CryptoError);
  });

  it('detects tampering (auth tag check)', async () => {
    const key = await generateAesKey();
    const ct = await aesEncrypt(new TextEncoder().encode('data'), key);
    // biome-ignore lint/style/noNonNullAssertion: we just created the array
    ct[ct.length - 1] = (ct[ct.length - 1]! ^ 0x01) & 0xff;
    await expect(aesDecrypt(ct, key)).rejects.toBeInstanceOf(CryptoError);
  });

  it('round-trips zero-byte plaintext', async () => {
    const key = await generateAesKey();
    const ct = await aesEncrypt(new Uint8Array(0), key);
    expect(ct.byteLength).toBe(28); // 12 IV + 16 tag + 0 ct
    const rt = await aesDecrypt(ct, key);
    expect(rt.byteLength).toBe(0);
  });

  it('property: arbitrary plaintext round-trips', async () => {
    await fc.assert(
      fc.asyncProperty(fc.uint8Array({ minLength: 0, maxLength: 4096 }), async (pt) => {
        const key = await generateAesKey();
        const rt = await aesDecrypt(await aesEncrypt(pt, key), key);
        expect(Array.from(rt)).toEqual(Array.from(pt));
      }),
      { numRuns: 50 },
    );
  });
});

describe('sha256', () => {
  it('matches a known vector', async () => {
    const digest = await sha256(new TextEncoder().encode('abc'));
    const hex = Array.from(digest, (b) => b.toString(16).padStart(2, '0')).join('');
    expect(hex).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  });
});
