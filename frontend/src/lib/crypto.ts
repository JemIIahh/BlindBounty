/**
 * Browser-side encryption utilities using the Web Crypto API.
 *
 * Wire formats:
 *   AES:   [12 IV][ciphertext+16 tag]  (AES-256-GCM, key = 32-byte Uint8Array)
 *   ECIES: [65 ephemeral pubkey][12 IV][ciphertext+16 tag]
 *          (P-256 ECDH; public key = 65-byte hex string, private key = 32-byte hex string)
 */

function toArrayBuffer(data: Uint8Array): ArrayBuffer {
  return data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer;
}

function hexToBytes(hex: string): Uint8Array {
  const clean = hex.startsWith('0x') ? hex.slice(2) : hex;
  const out = new Uint8Array(clean.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  return out;
}

// ── AES-256-GCM ──────────────────────────────────────────────────

/** Returns a random 32-byte AES key. */
export function generateAesKey(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(32));
}

export async function aesEncrypt(data: Uint8Array, key: Uint8Array): Promise<Uint8Array> {
  const cryptoKey = await crypto.subtle.importKey('raw', toArrayBuffer(key), 'AES-GCM', false, ['encrypt']);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, cryptoKey, toArrayBuffer(data));
  const out = new Uint8Array(12 + ct.byteLength);
  out.set(iv);
  out.set(new Uint8Array(ct), 12);
  return out;
}

export async function aesDecrypt(data: Uint8Array, key: Uint8Array): Promise<Uint8Array> {
  const cryptoKey = await crypto.subtle.importKey('raw', toArrayBuffer(key), 'AES-GCM', false, ['decrypt']);
  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: data.slice(0, 12) },
    cryptoKey,
    toArrayBuffer(data.slice(12)),
  );
  return new Uint8Array(plaintext);
}

// ── ECIES (P-256 ECDH + AES-GCM) ─────────────────────────────────

async function importP256Public(raw: Uint8Array): Promise<CryptoKey> {
  return crypto.subtle.importKey('raw', toArrayBuffer(raw), { name: 'ECDH', namedCurve: 'P-256' }, false, []);
}

/**
 * Encrypt data for a recipient identified by their 65-byte uncompressed P-256 public key (hex).
 * Returns the ECIES envelope as Uint8Array.
 */
export async function eciesEncrypt(data: Uint8Array, recipientPublicKeyHex: string): Promise<Uint8Array> {
  const recipientPub = await importP256Public(hexToBytes(recipientPublicKeyHex));
  const ephemeral = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveKey']);
  const sharedCryptoKey = await crypto.subtle.deriveKey(
    { name: 'ECDH', public: recipientPub },
    ephemeral.privateKey,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt'],
  );
  const sharedRaw = new Uint8Array(await crypto.subtle.exportKey('raw', sharedCryptoKey));
  const ephPubRaw = new Uint8Array(await crypto.subtle.exportKey('raw', ephemeral.publicKey)); // 65 bytes
  const encrypted = await aesEncrypt(data, sharedRaw);
  const out = new Uint8Array(65 + encrypted.length);
  out.set(ephPubRaw);
  out.set(encrypted, 65);
  return out;
}

/**
 * Decrypt an ECIES envelope using the recipient's 32-byte P-256 private key (hex string).
 * Returns the decrypted AES key bytes (or any plaintext).
 */
export async function eciesDecrypt(data: Uint8Array, privateKeyHex: string): Promise<Uint8Array> {
  const ephPubRaw = data.slice(0, 65);
  const encrypted = data.slice(65);
  const ephPub = await importP256Public(ephPubRaw);
  const dBytes = hexToBytes(privateKeyHex);

  // Build PKCS8 wrapper for the raw 32-byte P-256 private scalar
  const oidEcPublicKey = [0x2a, 0x86, 0x48, 0xce, 0x3d, 0x02, 0x01];
  const oidP256 = [0x2a, 0x86, 0x48, 0xce, 0x3d, 0x03, 0x01, 0x07];
  const ecPrivKey = [0x30, 0x31, 0x02, 0x01, 0x01, 0x04, 0x20, ...dBytes, 0xa0, 0x0a, 0x06, 0x08, ...oidP256];
  const algId = [0x30, 0x13, 0x06, 0x07, ...oidEcPublicKey, 0x06, 0x08, ...oidP256];
  const pkcs8Inner = [0x02, 0x01, 0x00, ...algId, 0x04, ecPrivKey.length, ...ecPrivKey];
  const pkcs8 = [0x30, pkcs8Inner.length, ...pkcs8Inner];

  const privKey = await crypto.subtle.importKey(
    'pkcs8',
    new Uint8Array(pkcs8).buffer as ArrayBuffer,
    { name: 'ECDH', namedCurve: 'P-256' },
    false,
    ['deriveKey'],
  );

  const sharedCryptoKey = await crypto.subtle.deriveKey(
    { name: 'ECDH', public: ephPub },
    privKey,
    { name: 'AES-GCM', length: 256 },
    true,
    ['decrypt'],
  );
  const sharedRaw = new Uint8Array(await crypto.subtle.exportKey('raw', sharedCryptoKey));
  return aesDecrypt(encrypted, sharedRaw);
}

export interface KeyPair {
  publicKeyHex: string;  // 65-byte uncompressed P-256, hex
  privateKeyHex: string; // 32-byte scalar, hex
}

export async function generateKeyPair(): Promise<KeyPair> {
  const pair = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveKey']);
  const pubRaw = new Uint8Array(await crypto.subtle.exportKey('raw', pair.publicKey));
  const privJwk = await crypto.subtle.exportKey('jwk', pair.privateKey) as JsonWebKey;
  const privBytes = new Uint8Array(
    Array.from(atob(privJwk.d!.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0)),
  );
  const toHex = (u8: Uint8Array) => Array.from(u8, (b) => b.toString(16).padStart(2, '0')).join('');
  return { publicKeyHex: toHex(pubRaw), privateKeyHex: toHex(privBytes) };
}

// ── SHA-256 ───────────────────────────────────────────────────────

export async function sha256(data: Uint8Array): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', toArrayBuffer(data));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
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
