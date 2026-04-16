/**
 * Browser-side encryption utilities using Web Crypto API.
 * Produces identical byte format as backend/src/services/crypto.ts:
 *   AES blob: [12 IV][16 tag][ciphertext]
 *   ECIES blob: [65 ephemeral pubkey][AES blob]
 */

import { ethers } from 'ethers';

const IV_LENGTH = 12;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;
const ECIES_PUBKEY_LENGTH = 65;
const ECIES_HKDF_INFO = 'BlindBounty-ECIES-v1';

/** Helper: copy Uint8Array into a fresh ArrayBuffer-backed Uint8Array (fixes TS BufferSource compat) */
function buf(data: Uint8Array): Uint8Array<ArrayBuffer> {
  const copy = new Uint8Array(data.length);
  copy.set(data);
  return copy;
}

// ── AES-256-GCM ──

export async function generateAesKey(): Promise<Uint8Array> {
  const key = new Uint8Array(KEY_LENGTH);
  crypto.getRandomValues(key);
  return key;
}

export async function aesEncrypt(plaintext: Uint8Array, key: Uint8Array): Promise<Uint8Array> {
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const cryptoKey = await crypto.subtle.importKey('raw', buf(key), 'AES-GCM', false, ['encrypt']);
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv, tagLength: TAG_LENGTH * 8 },
    cryptoKey,
    buf(plaintext),
  );
  const encryptedBytes = new Uint8Array(encrypted);
  const ciphertext = encryptedBytes.slice(0, encryptedBytes.length - TAG_LENGTH);
  const tag = encryptedBytes.slice(encryptedBytes.length - TAG_LENGTH);
  const result = new Uint8Array(IV_LENGTH + TAG_LENGTH + ciphertext.length);
  result.set(iv, 0);
  result.set(tag, IV_LENGTH);
  result.set(ciphertext, IV_LENGTH + TAG_LENGTH);
  return result;
}

export async function aesDecrypt(blob: Uint8Array, key: Uint8Array): Promise<Uint8Array> {
  const iv = blob.slice(0, IV_LENGTH);
  const tag = blob.slice(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
  const ciphertext = blob.slice(IV_LENGTH + TAG_LENGTH);
  const combined = new Uint8Array(ciphertext.length + TAG_LENGTH);
  combined.set(ciphertext, 0);
  combined.set(tag, ciphertext.length);
  const cryptoKey = await crypto.subtle.importKey('raw', buf(key), 'AES-GCM', false, ['decrypt']);
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: buf(iv), tagLength: TAG_LENGTH * 8 },
    cryptoKey,
    buf(combined),
  );
  return new Uint8Array(decrypted);
}

// ── ECIES (secp256k1 via ethers + Web Crypto HKDF) ──

export function generateKeyPair(): { privateKey: string; publicKey: string } {
  const wallet = ethers.Wallet.createRandom();
  return {
    privateKey: wallet.privateKey.slice(2),
    publicKey: wallet.signingKey.publicKey.slice(2),
  };
}

async function deriveSharedKey(sharedSecret: Uint8Array): Promise<Uint8Array> {
  const ikm = await crypto.subtle.importKey('raw', buf(sharedSecret), 'HKDF', false, ['deriveBits']);
  const derived = await crypto.subtle.deriveBits(
    {
      name: 'HKDF',
      hash: 'SHA-256',
      salt: new Uint8Array(0),
      info: new TextEncoder().encode(ECIES_HKDF_INFO),
    },
    ikm,
    KEY_LENGTH * 8,
  );
  return new Uint8Array(derived);
}

function computeSharedSecret(privateKeyHex: string, publicKeyHex: string): Uint8Array {
  const signingKey = new ethers.SigningKey(`0x${privateKeyHex}`);
  const sharedPoint = signingKey.computeSharedSecret(`0x${publicKeyHex}`);
  return ethers.getBytes(sharedPoint).slice(1, 33);
}

export async function eciesEncrypt(data: Uint8Array, recipientPubKeyHex: string): Promise<Uint8Array> {
  const ephemeral = ethers.Wallet.createRandom();
  const ephPriv = ephemeral.privateKey.slice(2);
  const ephPub = ethers.getBytes(`0x${ephemeral.signingKey.publicKey.slice(2)}`);

  const sharedSecret = computeSharedSecret(ephPriv, recipientPubKeyHex);
  const derivedKey = await deriveSharedKey(sharedSecret);
  const encrypted = await aesEncrypt(data, derivedKey);

  const result = new Uint8Array(ECIES_PUBKEY_LENGTH + encrypted.length);
  result.set(ephPub, 0);
  result.set(encrypted, ECIES_PUBKEY_LENGTH);
  return result;
}

export async function eciesDecrypt(blob: Uint8Array, recipientPrivKeyHex: string): Promise<Uint8Array> {
  const ephemeralPub = blob.slice(0, ECIES_PUBKEY_LENGTH);
  const encrypted = blob.slice(ECIES_PUBKEY_LENGTH);

  const ephemeralPubHex = ethers.hexlify(buf(ephemeralPub)).slice(2);
  const sharedSecret = computeSharedSecret(recipientPrivKeyHex, ephemeralPubHex);
  const derivedKey = await deriveSharedKey(sharedSecret);

  return aesDecrypt(encrypted, derivedKey);
}

// ── SHA-256 ──

export async function sha256(data: Uint8Array): Promise<string> {
  const hash = await crypto.subtle.digest('SHA-256', buf(data));
  return ethers.hexlify(new Uint8Array(hash)).slice(2);
}

// ── Helpers ──

export function toBytes(text: string): Uint8Array {
  return new TextEncoder().encode(text);
}

export function fromBytes(bytes: Uint8Array): string {
  return new TextDecoder().decode(bytes);
}

export function toBase64(bytes: Uint8Array): string {
  // Chunked conversion to avoid stack overflow on large payloads
  // (String.fromCharCode(...bytes) fails when bytes.length > ~65536)
  let binary = '';
  const chunkSize = 8192;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, Math.min(i + chunkSize, bytes.length));
    binary += String.fromCharCode.apply(null, chunk as unknown as number[]);
  }
  return btoa(binary);
}

export function fromBase64(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}
