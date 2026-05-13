/**
 * Browser-side encryption utilities for BlindMarket.
 *
 * Byte-compatible with backend/src/services/crypto.ts and sdk/src/crypto.
 * Wire formats:
 *   AES:   [12 IV][16 tag][ciphertext]   (AES-256-GCM, 32-byte key)
 *   ECIES: [65 ephemeral pubkey][AES blob]
 *          (secp256k1 ECDH → HKDF-SHA256("BlindMarket-ECIES-v1") → AES-256-GCM)
 *
 * Curve is secp256k1 — matches the agent wallet's pubkey so we can wrap the
 * AES key directly to an executor's wallet public key with no second keypair.
 * Web Crypto only natively supports P-256/P-384/P-521, so we use ethers'
 * SigningKey for the ECDH step and Web Crypto for HKDF + AES-GCM.
 */

import { SigningKey, Wallet } from 'ethers';

const IV_LENGTH = 12;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;
const ECIES_PUBKEY_LENGTH = 65;
const ECIES_HKDF_INFO = new TextEncoder().encode('BlindMarket-ECIES-v1');

// ── helpers ──────────────────────────────────────────────────────

function toArrayBuffer(u: Uint8Array): ArrayBuffer {
  const ab = new ArrayBuffer(u.byteLength);
  new Uint8Array(ab).set(u);
  return ab;
}

function hexToBytes(hex: string): Uint8Array {
  const clean = hex.startsWith('0x') ? hex.slice(2) : hex;
  const out = new Uint8Array(clean.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  return out;
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

function strip0x(hex: string): string {
  return hex.startsWith('0x') ? hex.slice(2) : hex;
}

// ── AES-256-GCM ──────────────────────────────────────────────────

/** Returns a random 32-byte AES key. */
export function generateAesKey(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(KEY_LENGTH));
}

/**
 * AES-256-GCM encrypt. Output: [12 IV][16 tag][ciphertext].
 * Matches backend/SDK byte-for-byte so an executor decoding with the unwrapped
 * AES key downstream gets the original plaintext.
 */
export async function aesEncrypt(plaintext: Uint8Array, key: Uint8Array): Promise<Uint8Array> {
  if (key.byteLength !== KEY_LENGTH) throw new Error(`AES key must be ${KEY_LENGTH} bytes`);
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const ck = await crypto.subtle.importKey('raw', toArrayBuffer(key), 'AES-GCM', false, ['encrypt']);
  // WebCrypto returns [ciphertext || tag]; rewrite to [IV || tag || ciphertext].
  const wc = new Uint8Array(
    await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: toArrayBuffer(iv), tagLength: TAG_LENGTH * 8 },
      ck,
      toArrayBuffer(plaintext),
    ),
  );
  const ctLen = wc.length - TAG_LENGTH;
  const ct = wc.subarray(0, ctLen);
  const tag = wc.subarray(ctLen);
  const out = new Uint8Array(IV_LENGTH + TAG_LENGTH + ctLen);
  out.set(iv, 0);
  out.set(tag, IV_LENGTH);
  out.set(ct, IV_LENGTH + TAG_LENGTH);
  return out;
}

/** AES-256-GCM decrypt. Input: [12 IV][16 tag][ciphertext]. */
export async function aesDecrypt(blob: Uint8Array, key: Uint8Array): Promise<Uint8Array> {
  if (key.byteLength !== KEY_LENGTH) throw new Error(`AES key must be ${KEY_LENGTH} bytes`);
  if (blob.byteLength < IV_LENGTH + TAG_LENGTH) throw new Error('AES blob too short');
  const iv = blob.subarray(0, IV_LENGTH);
  const tag = blob.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
  const ct = blob.subarray(IV_LENGTH + TAG_LENGTH);
  // WebCrypto expects [ciphertext || tag] — rewrite from our [IV][tag][ct].
  const combined = new Uint8Array(ct.length + TAG_LENGTH);
  combined.set(ct, 0);
  combined.set(tag, ct.length);
  const ck = await crypto.subtle.importKey('raw', toArrayBuffer(key), 'AES-GCM', false, ['decrypt']);
  const pt = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: toArrayBuffer(iv), tagLength: TAG_LENGTH * 8 },
    ck,
    toArrayBuffer(combined),
  );
  return new Uint8Array(pt);
}

// ── HKDF-SHA256 ──────────────────────────────────────────────────

async function hkdfSha256(ikm: Uint8Array, length = KEY_LENGTH): Promise<Uint8Array> {
  const base = await crypto.subtle.importKey('raw', toArrayBuffer(ikm), 'HKDF', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    {
      name: 'HKDF',
      hash: 'SHA-256',
      info: toArrayBuffer(ECIES_HKDF_INFO),
      salt: toArrayBuffer(new Uint8Array(0)),
    },
    base,
    length * 8,
  );
  return new Uint8Array(bits);
}

// ── ECIES (secp256k1) ────────────────────────────────────────────

/**
 * Compute the ECDH shared-secret X-coordinate (32 bytes) between a private key
 * and a peer's secp256k1 public key. Matches the backend's
 * createECDH('secp256k1').computeSecret() output byte-for-byte (ethers returns
 * 0x04||X||Y; we slice X).
 */
function deriveSharedSecretX(privKeyHex: string, peerPubKeyHex: string): Uint8Array {
  const sk = new SigningKey('0x' + strip0x(privKeyHex));
  const shared = sk.computeSharedSecret('0x' + strip0x(peerPubKeyHex));
  const bytes = hexToBytes(strip0x(shared));
  if (bytes.byteLength !== ECIES_PUBKEY_LENGTH || bytes[0] !== 0x04) {
    throw new Error(`Unexpected shared-secret shape (len=${bytes.byteLength})`);
  }
  return bytes.subarray(1, 33);
}

/**
 * ECIES-secp256k1 encrypt. Wraps `plaintext` to an uncompressed secp256k1
 * pubkey. Output: [65 ephemeral pubkey][AES blob].
 *
 * `recipientPubKeyHex` accepts both `04…` and `0x04…` forms (130 hex chars).
 */
export async function eciesEncrypt(plaintext: Uint8Array, recipientPubKeyHex: string): Promise<Uint8Array> {
  const clean = strip0x(recipientPubKeyHex);
  if (!/^04[0-9a-fA-F]{128}$/.test(clean)) {
    throw new Error('eciesEncrypt: pubkey must be uncompressed secp256k1 hex (04 + 128 hex chars)');
  }
  const ephemeral = Wallet.createRandom();
  const shared = deriveSharedSecretX(ephemeral.privateKey, '0x' + clean);
  const aesKey = await hkdfSha256(shared, KEY_LENGTH);
  const aesBlob = await aesEncrypt(plaintext, aesKey);
  const ephPub = hexToBytes(strip0x(ephemeral.signingKey.publicKey));
  if (ephPub.byteLength !== ECIES_PUBKEY_LENGTH) {
    throw new Error(`Ephemeral pubkey wrong length (${ephPub.byteLength})`);
  }
  const out = new Uint8Array(ECIES_PUBKEY_LENGTH + aesBlob.byteLength);
  out.set(ephPub, 0);
  out.set(aesBlob, ECIES_PUBKEY_LENGTH);
  return out;
}

/**
 * ECIES-secp256k1 decrypt. Input: [65 ephemeral pubkey][AES blob].
 * Useful client-side for testing the round-trip; production decryption
 * happens inside the worker process.
 */
export async function eciesDecrypt(blob: Uint8Array, recipientPrivKeyHex: string): Promise<Uint8Array> {
  if (blob.byteLength < ECIES_PUBKEY_LENGTH + IV_LENGTH + TAG_LENGTH) {
    throw new Error('ECIES blob too short');
  }
  const ephPub = blob.subarray(0, ECIES_PUBKEY_LENGTH);
  const aesBlob = blob.subarray(ECIES_PUBKEY_LENGTH);
  const shared = deriveSharedSecretX(recipientPrivKeyHex, '0x' + bytesToHex(ephPub));
  const aesKey = await hkdfSha256(shared, KEY_LENGTH);
  return aesDecrypt(aesBlob, aesKey);
}

// ── SHA-256 ───────────────────────────────────────────────────────

export async function sha256(data: Uint8Array): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', toArrayBuffer(data));
  return bytesToHex(new Uint8Array(digest));
}

// ── Byte / text / base64 helpers ─────────────────────────────────

export function toBytes(text: string): Uint8Array {
  return new TextEncoder().encode(text);
}

export function fromBytes(bytes: Uint8Array): string {
  return new TextDecoder().decode(bytes);
}

export function toBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]!);
  return btoa(binary);
}

export function fromBase64(b64: string): Uint8Array {
  const binary = atob(b64);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
  return out;
}
