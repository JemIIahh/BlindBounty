import { CryptoError } from '../errors/index.js';
import { AES_MIN_BLOB, IV_LENGTH, KEY_LENGTH, TAG_LENGTH } from './constants.js';

function getCrypto(): Crypto {
  const c = (globalThis as { crypto?: Crypto }).crypto;
  if (!c?.subtle) {
    throw new CryptoError('CRYPTO/UNSUPPORTED_CIPHER', 'Web Crypto (crypto.subtle) is not available');
  }
  return c;
}

function toArrayBuffer(u: Uint8Array): ArrayBuffer {
  const ab = new ArrayBuffer(u.byteLength);
  new Uint8Array(ab).set(u);
  return ab;
}

/** Generate a fresh 32-byte AES-256 key. */
export async function generateAesKey(): Promise<Uint8Array> {
  const key = new Uint8Array(KEY_LENGTH);
  getCrypto().getRandomValues(key);
  return key;
}

/**
 * AES-256-GCM encrypt. Output format: [12 IV][16 tag][ciphertext].
 * This ordering matches backend/src/services/crypto.ts and frontend/src/lib/crypto.ts
 * byte-for-byte, so SDK blobs decrypt anywhere in the stack.
 */
export async function aesEncrypt(plaintext: Uint8Array, key: Uint8Array): Promise<Uint8Array> {
  if (key.byteLength !== KEY_LENGTH) {
    throw new CryptoError(
      'CRYPTO/INVALID_KEY',
      `AES key must be ${KEY_LENGTH} bytes, got ${key.byteLength}`,
    );
  }
  const c = getCrypto();
  const iv = new Uint8Array(IV_LENGTH);
  c.getRandomValues(iv);
  try {
    const ck = await c.subtle.importKey('raw', toArrayBuffer(key), 'AES-GCM', false, ['encrypt']);
    const wcOut = new Uint8Array(
      await c.subtle.encrypt(
        { name: 'AES-GCM', iv: toArrayBuffer(iv), tagLength: TAG_LENGTH * 8 },
        ck,
        toArrayBuffer(plaintext),
      ),
    );
    // WebCrypto returns [ciphertext || tag]. Rewrite to [IV || tag || ciphertext].
    const ctLen = wcOut.length - TAG_LENGTH;
    const ct = wcOut.subarray(0, ctLen);
    const tag = wcOut.subarray(ctLen);
    const blob = new Uint8Array(IV_LENGTH + TAG_LENGTH + ctLen);
    blob.set(iv, 0);
    blob.set(tag, IV_LENGTH);
    blob.set(ct, IV_LENGTH + TAG_LENGTH);
    return blob;
  } catch (cause) {
    throw new CryptoError('CRYPTO/DECRYPT_FAILED', 'AES-GCM encryption failed', { cause });
  }
}

/**
 * AES-256-GCM decrypt. Input format: [12 IV][16 tag][ciphertext].
 * Throws CRYPTO/INTEGRITY_CHECK on truncation or tag mismatch.
 */
export async function aesDecrypt(blob: Uint8Array, key: Uint8Array): Promise<Uint8Array> {
  if (key.byteLength !== KEY_LENGTH) {
    throw new CryptoError(
      'CRYPTO/INVALID_KEY',
      `AES key must be ${KEY_LENGTH} bytes, got ${key.byteLength}`,
    );
  }
  if (blob.byteLength < AES_MIN_BLOB) {
    throw new CryptoError(
      'CRYPTO/INTEGRITY_CHECK',
      `AES blob too short: need ≥${AES_MIN_BLOB} bytes, got ${blob.byteLength}`,
    );
  }
  const iv = blob.subarray(0, IV_LENGTH);
  const tag = blob.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
  const ct = blob.subarray(IV_LENGTH + TAG_LENGTH);
  const combined = new Uint8Array(ct.length + TAG_LENGTH);
  combined.set(ct, 0);
  combined.set(tag, ct.length);
  try {
    const c = getCrypto();
    const ck = await c.subtle.importKey('raw', toArrayBuffer(key), 'AES-GCM', false, ['decrypt']);
    const pt = await c.subtle.decrypt(
      { name: 'AES-GCM', iv: toArrayBuffer(iv), tagLength: TAG_LENGTH * 8 },
      ck,
      toArrayBuffer(combined),
    );
    return new Uint8Array(pt);
  } catch (cause) {
    throw new CryptoError('CRYPTO/DECRYPT_FAILED', 'AES-GCM decryption failed (wrong key or tampered data)', { cause });
  }
}

/** SHA-256 of arbitrary bytes. Returns 32-byte digest. */
export async function sha256(data: Uint8Array): Promise<Uint8Array> {
  const digest = await getCrypto().subtle.digest('SHA-256', toArrayBuffer(data));
  return new Uint8Array(digest);
}
