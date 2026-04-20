/**
 * Browser-side encryption utilities — now a thin re-export layer over
 * @blindbounty/sdk/crypto. The SDK is the single source of truth for wire
 * formats; keeping this file lets existing frontend imports (`from '../lib/crypto'`)
 * continue working without a mass rename.
 *
 * Wire formats (enforced by the SDK):
 *   AES:   [12 IV][16 tag][ciphertext]
 *   ECIES: [65 ephemeral pubkey][AES blob]
 */

export {
  aesEncrypt,
  aesDecrypt,
  generateAesKey,
  eciesEncrypt,
  eciesDecrypt,
  generateKeyPair,
} from '@blindbounty/sdk/crypto';

import { sha256 as sdkSha256 } from '@blindbounty/sdk/crypto';

/** SHA-256 of bytes, returned as a lowercase hex string (no 0x prefix). */
export async function sha256(data: Uint8Array): Promise<string> {
  const digest = await sdkSha256(data);
  return Array.from(digest, (b) => b.toString(16).padStart(2, '0')).join('');
}

// ── Byte / text / base64 helpers (not part of the SDK surface) ──

export function toBytes(text: string): Uint8Array {
  return new TextEncoder().encode(text);
}

export function fromBytes(bytes: Uint8Array): string {
  return new TextDecoder().decode(bytes);
}

export function toBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return btoa(binary);
}

export function fromBase64(b64: string): Uint8Array {
  const binary = atob(b64);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    out[i] = binary.charCodeAt(i);
  }
  return out;
}
