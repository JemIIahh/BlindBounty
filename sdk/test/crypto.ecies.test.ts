import * as fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import {
  derivePublicKey,
  eciesDecrypt,
  eciesEncrypt,
  generateKeyPair,
} from '../src/crypto/index.js';
import { CryptoError } from '../src/errors/index.js';

describe('ecies secp256k1', () => {
  it('round-trips', async () => {
    const { privateKey, publicKey } = generateKeyPair();
    const pt = new TextEncoder().encode('secret instructions');
    const ct = await eciesEncrypt(pt, publicKey);
    const rt = await eciesDecrypt(ct, privateKey);
    expect(new TextDecoder().decode(rt)).toBe('secret instructions');
  });

  it('wire format: [65 ephemeral pubkey][12 IV][16 tag][ciphertext]', async () => {
    const { publicKey } = generateKeyPair();
    const ct = await eciesEncrypt(new Uint8Array([1, 2, 3]), publicKey);
    expect(ct.byteLength).toBe(65 + 12 + 16 + 3);
    // First byte of ephemeral pubkey must be 0x04 (uncompressed marker)
    expect(ct[0]).toBe(0x04);
  });

  it('wrong private key fails', async () => {
    const good = generateKeyPair();
    const bad = generateKeyPair();
    const ct = await eciesEncrypt(new Uint8Array([9]), good.publicKey);
    await expect(eciesDecrypt(ct, bad.privateKey)).rejects.toBeInstanceOf(CryptoError);
  });

  it('rejects truncated blobs', async () => {
    const { privateKey } = generateKeyPair();
    await expect(eciesDecrypt(new Uint8Array(30), privateKey)).rejects.toBeInstanceOf(CryptoError);
  });

  it('rejects compressed / malformed recipient pubkey', async () => {
    const bogus = '02' + '00'.repeat(32); // compressed form (33 bytes), not supported
    await expect(eciesEncrypt(new Uint8Array([0]), bogus)).rejects.toBeInstanceOf(CryptoError);
  });

  it('derivePublicKey recovers the same pubkey used for encryption', async () => {
    const { privateKey, publicKey } = generateKeyPair();
    const recovered = derivePublicKey(privateKey);
    expect(recovered.toLowerCase()).toBe(publicKey.toLowerCase());
    const pt = new TextEncoder().encode('x');
    const ct = await eciesEncrypt(pt, recovered);
    expect(new TextDecoder().decode(await eciesDecrypt(ct, privateKey))).toBe('x');
  });

  it('property: arbitrary plaintext round-trips', async () => {
    await fc.assert(
      fc.asyncProperty(fc.uint8Array({ minLength: 0, maxLength: 1024 }), async (pt) => {
        const { privateKey, publicKey } = generateKeyPair();
        const rt = await eciesDecrypt(await eciesEncrypt(pt, publicKey), privateKey);
        expect(Array.from(rt)).toEqual(Array.from(pt));
      }),
      { numRuns: 25 },
    );
  });
});
