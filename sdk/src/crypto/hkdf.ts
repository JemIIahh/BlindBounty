import { CryptoError } from '../errors/index.js';
import { ECIES_HKDF_INFO } from './constants.js';

function getSubtle(): SubtleCrypto {
  const c = (globalThis as { crypto?: Crypto }).crypto;
  if (!c?.subtle) {
    throw new CryptoError('CRYPTO/UNSUPPORTED_CIPHER', 'Web Crypto (crypto.subtle) is not available');
  }
  return c.subtle;
}

function toArrayBuffer(u: Uint8Array): ArrayBuffer {
  const ab = new ArrayBuffer(u.byteLength);
  new Uint8Array(ab).set(u);
  return ab;
}

/**
 * HKDF-SHA256. Defaults match backend: empty salt, the ECIES domain separation info,
 * 32-byte output length. Pass custom values for other uses.
 */
export async function hkdfSha256(
  ikm: Uint8Array,
  length = 32,
  info: Uint8Array = ECIES_HKDF_INFO,
  salt: Uint8Array = new Uint8Array(0),
): Promise<Uint8Array> {
  try {
    const subtle = getSubtle();
    const baseKey = await subtle.importKey('raw', toArrayBuffer(ikm), 'HKDF', false, ['deriveBits']);
    const derived = await subtle.deriveBits(
      {
        name: 'HKDF',
        hash: 'SHA-256',
        info: toArrayBuffer(info),
        salt: toArrayBuffer(salt),
      },
      baseKey,
      length * 8,
    );
    return new Uint8Array(derived);
  } catch (cause) {
    throw new CryptoError('CRYPTO/INVALID_KEY', 'HKDF derivation failed', { cause });
  }
}
