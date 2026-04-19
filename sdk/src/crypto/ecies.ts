import { ethers } from 'ethers';
import { CryptoError } from '../errors/index.js';
import { aesDecrypt, aesEncrypt } from './aes.js';
import { ECIES_MIN_BLOB, ECIES_PUBKEY_LENGTH, KEY_LENGTH } from './constants.js';
import { hkdfSha256 } from './hkdf.js';
import { assertUncompressedPubKey, bytesToHex, hexToBytes, strip } from './keys.js';

/**
 * ECIES-secp256k1 encrypt to a recipient's uncompressed public key.
 * Wire format: [65 ephemeral pubkey][12 IV][16 tag][ciphertext].
 * Byte-compatible with backend/src/services/crypto.ts.
 */
export async function eciesEncrypt(plaintext: Uint8Array, recipientPubKey: string): Promise<Uint8Array> {
  assertUncompressedPubKey(recipientPubKey);
  const ephemeral = ethers.Wallet.createRandom();
  const shared = deriveSharedSecretX(ephemeral.privateKey, `0x${strip(recipientPubKey)}`);
  const aesKey = await hkdfSha256(shared, KEY_LENGTH);
  const aesBlob = await aesEncrypt(plaintext, aesKey);
  const ephPub = hexToBytes(strip(ephemeral.signingKey.publicKey));
  if (ephPub.byteLength !== ECIES_PUBKEY_LENGTH) {
    throw new CryptoError('CRYPTO/INVALID_KEY', `ephemeral pubkey length ${ephPub.byteLength}`);
  }
  const blob = new Uint8Array(ECIES_PUBKEY_LENGTH + aesBlob.byteLength);
  blob.set(ephPub, 0);
  blob.set(aesBlob, ECIES_PUBKEY_LENGTH);
  return blob;
}

/** ECIES-secp256k1 decrypt with the recipient's private key. */
export async function eciesDecrypt(blob: Uint8Array, recipientPrivKey: string): Promise<Uint8Array> {
  if (blob.byteLength < ECIES_MIN_BLOB) {
    throw new CryptoError(
      'CRYPTO/INTEGRITY_CHECK',
      `ECIES blob too short: need ≥${ECIES_MIN_BLOB} bytes, got ${blob.byteLength}`,
    );
  }
  const ephPub = blob.subarray(0, ECIES_PUBKEY_LENGTH);
  const aesBlob = blob.subarray(ECIES_PUBKEY_LENGTH);
  const shared = deriveSharedSecretX(`0x${strip(recipientPrivKey)}`, `0x${bytesToHex(ephPub)}`);
  const aesKey = await hkdfSha256(shared, KEY_LENGTH);
  return aesDecrypt(aesBlob, aesKey);
}

/**
 * Compute the ECDH shared secret X coordinate (32 bytes) between a private key
 * and a peer's public key. Matches Node createECDH.computeSecret() output used by
 * the backend — ethers v6 returns 0x04||X||Y, so we slice X.
 */
function deriveSharedSecretX(privHex: string, pubHex: string): Uint8Array {
  const sk = new ethers.SigningKey(privHex);
  const shared = sk.computeSharedSecret(pubHex);
  const bytes = hexToBytes(strip(shared));
  if (bytes.byteLength !== 65 || bytes[0] !== 0x04) {
    throw new CryptoError(
      'CRYPTO/INVALID_KEY',
      `unexpected shared secret shape (len=${bytes.byteLength}, prefix=${bytes[0]?.toString(16) ?? 'none'})`,
    );
  }
  return bytes.subarray(1, 33);
}
