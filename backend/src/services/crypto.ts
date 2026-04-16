import { randomBytes, createCipheriv, createDecipheriv, createHash, createECDH, hkdfSync } from 'crypto';

/**
 * Encryption utilities for BlindBounty.
 *
 * The backend NEVER decrypts task content or evidence.
 * These utilities exist so the SDK/frontend can:
 *   1. Encrypt blobs with AES-256-GCM before uploading
 *   2. Wrap AES keys with ECIES for key exchange
 *   3. Generate keypairs (ECDH on secp256k1)
 *
 * Flow:
 *   Agent creates task:
 *     - Generate AES key → encrypt instructions → upload to 0G
 *     - ECIES-wrap AES key to agent's own pubkey (self-backup)
 *
 *   Agent assigns worker:
 *     - ECIES-wrap same AES key to worker's pubkey → send wrapped key
 *
 *   Worker submits evidence:
 *     - Generate new AES key → encrypt evidence → upload to 0G
 *     - ECIES-wrap to enclave pubkey (for Sealed Inference)
 *     - ECIES-wrap to agent pubkey (for agent review)
 */

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;     // GCM standard
const TAG_LENGTH = 16;    // GCM auth tag
const KEY_LENGTH = 32;    // AES-256
const ECIES_PUBKEY_LENGTH = 65; // uncompressed secp256k1
const ECIES_MIN_BLOB = ECIES_PUBKEY_LENGTH + IV_LENGTH + TAG_LENGTH + 1; // 94 bytes minimum
const AES_MIN_BLOB = IV_LENGTH + TAG_LENGTH + 1; // 29 bytes minimum

// Domain separation string for ECIES key derivation (prevents cross-protocol reuse)
const ECIES_HKDF_INFO = 'BlindBounty-ECIES-v1';

// ── AES-256-GCM (symmetric) ──

/** Encrypt plaintext with AES-256-GCM. Returns iv + tag + ciphertext concatenated. */
export function aesEncrypt(plaintext: Buffer, key: Buffer): Buffer {
  if (key.length !== KEY_LENGTH) {
    throw new Error(`AES key must be exactly ${KEY_LENGTH} bytes, got ${key.length}`);
  }
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv, { authTagLength: TAG_LENGTH });
  const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();
  // Format: [12 bytes IV][16 bytes tag][ciphertext]
  return Buffer.concat([iv, tag, encrypted]);
}

/** Decrypt AES-256-GCM blob. Input format: [12 IV][16 tag][ciphertext]. */
export function aesDecrypt(blob: Buffer, key: Buffer): Buffer {
  if (key.length !== KEY_LENGTH) {
    throw new Error(`AES key must be exactly ${KEY_LENGTH} bytes, got ${key.length}`);
  }
  if (blob.length < AES_MIN_BLOB) {
    throw new Error(`AES blob too short: need at least ${AES_MIN_BLOB} bytes, got ${blob.length}`);
  }
  const iv = blob.subarray(0, IV_LENGTH);
  const tag = blob.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
  const ciphertext = blob.subarray(IV_LENGTH + TAG_LENGTH);
  const decipher = createDecipheriv(ALGORITHM, key, iv, { authTagLength: TAG_LENGTH });
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
}

/** Generate a random AES-256 key */
export function generateAesKey(): Buffer {
  return randomBytes(KEY_LENGTH);
}

// ── ECIES (asymmetric key wrapping via ECDH + HKDF + AES) ──

/** Generate a secp256k1 keypair. Returns { privateKey, publicKey } as hex strings. */
export function generateKeyPair(): { privateKey: string; publicKey: string } {
  const ecdh = createECDH('secp256k1');
  ecdh.generateKeys();
  return {
    privateKey: ecdh.getPrivateKey('hex'),
    publicKey: ecdh.getPublicKey('hex', 'uncompressed'),
  };
}

/**
 * ECIES encrypt: wrap data to a recipient's public key.
 *
 * 1. Generate ephemeral keypair
 * 2. ECDH shared secret with recipient's pubkey
 * 3. Derive AES key via HKDF-SHA256 with domain separation
 * 4. AES-256-GCM encrypt the data
 * 5. Return ephemeralPubKey + encrypted blob
 */
export function eciesEncrypt(data: Buffer, recipientPubKeyHex: string): Buffer {
  const ephemeral = createECDH('secp256k1');
  ephemeral.generateKeys();

  const sharedSecret = ephemeral.computeSecret(Buffer.from(recipientPubKeyHex, 'hex'));
  const derivedKey = Buffer.from(hkdfSync('sha256', sharedSecret, '', ECIES_HKDF_INFO, KEY_LENGTH));

  const encrypted = aesEncrypt(data, derivedKey);
  const ephemeralPub = ephemeral.getPublicKey();

  // Format: [65 bytes uncompressed ephemeral pubkey][encrypted blob]
  return Buffer.concat([ephemeralPub, encrypted]);
}

/**
 * ECIES decrypt: unwrap data with recipient's private key.
 *
 * 1. Extract ephemeral pubkey (first 65 bytes)
 * 2. ECDH shared secret with own private key
 * 3. Derive AES key via HKDF-SHA256 with domain separation
 * 4. AES-256-GCM decrypt
 */
export function eciesDecrypt(blob: Buffer, recipientPrivKeyHex: string): Buffer {
  if (blob.length < ECIES_MIN_BLOB) {
    throw new Error(`ECIES blob too short: need at least ${ECIES_MIN_BLOB} bytes, got ${blob.length}`);
  }

  const ephemeralPub = blob.subarray(0, ECIES_PUBKEY_LENGTH);
  const encrypted = blob.subarray(ECIES_PUBKEY_LENGTH);

  const ecdh = createECDH('secp256k1');
  ecdh.setPrivateKey(Buffer.from(recipientPrivKeyHex, 'hex'));

  const sharedSecret = ecdh.computeSecret(ephemeralPub);
  const derivedKey = Buffer.from(hkdfSync('sha256', sharedSecret, '', ECIES_HKDF_INFO, KEY_LENGTH));

  return aesDecrypt(encrypted, derivedKey);
}

/** SHA-256 hash of data, returned as hex string (for on-chain taskHash/evidenceHash) */
export function sha256(data: Buffer): string {
  return createHash('sha256').update(data).digest('hex');
}

/** Generate a random nonce (hex string) */
export function generateNonce(): string {
  return randomBytes(32).toString('hex');
}
