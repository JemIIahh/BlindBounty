import { ethers } from 'ethers';
import { CryptoError } from '../errors/index.js';

export interface KeyPair {
  privateKey: string;
  publicKey: string;
}

/** Fresh secp256k1 keypair. Hex strings returned un-prefixed (no 0x). */
export function generateKeyPair(): KeyPair {
  const w = ethers.Wallet.createRandom();
  return {
    privateKey: w.privateKey.slice(2),
    publicKey: w.signingKey.publicKey.slice(2),
  };
}

/** Recover the uncompressed public key (un-prefixed hex) from a private key. */
export function derivePublicKey(privateKey: string): string {
  const sk = new ethers.SigningKey(`0x${strip(privateKey)}`);
  return sk.publicKey.slice(2);
}

export function strip(hex: string): string {
  return hex.startsWith('0x') || hex.startsWith('0X') ? hex.slice(2) : hex;
}

export function assertUncompressedPubKey(pub: string): void {
  const s = strip(pub);
  if (s.length !== 130 || !/^04/i.test(s)) {
    throw new CryptoError(
      'CRYPTO/INVALID_KEY',
      'expected uncompressed secp256k1 pubkey (65 bytes hex, starts with 04)',
    );
  }
}

export function hexToBytes(hex: string): Uint8Array {
  const s = strip(hex);
  if (s.length % 2 !== 0) {
    throw new CryptoError('CRYPTO/INVALID_KEY', 'hex string has odd length');
  }
  const out = new Uint8Array(s.length / 2);
  for (let i = 0; i < out.length; i++) {
    const byte = Number.parseInt(s.substring(i * 2, i * 2 + 2), 16);
    if (Number.isNaN(byte)) {
      throw new CryptoError('CRYPTO/INVALID_KEY', `invalid hex byte at position ${i * 2}`);
    }
    out[i] = byte;
  }
  return out;
}

export function bytesToHex(u: Uint8Array): string {
  return Array.from(u, (b) => b.toString(16).padStart(2, '0')).join('');
}
