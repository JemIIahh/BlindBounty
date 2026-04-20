import { ethers } from 'ethers';
import { describe, expect, it } from 'vitest';
import { eciesDecrypt, eciesEncrypt } from '../src/crypto/index.js';
import { EthersSigner, PrivateKeySigner } from '../src/signer/index.js';

const FIXED_PK = '0x0123456789012345678901234567890123456789012345678901234567890123';
const FIXED_ADDR = '0x14791697260E4c9A71f18484C9f997B308e59325';

describe('PrivateKeySigner', () => {
  it('derives the correct address from a known private key', async () => {
    const signer = new PrivateKeySigner(FIXED_PK);
    expect((await signer.getAddress()).toLowerCase()).toBe(FIXED_ADDR.toLowerCase());
  });

  it('accepts the private key with or without 0x prefix', async () => {
    const a = new PrivateKeySigner(FIXED_PK);
    const b = new PrivateKeySigner(FIXED_PK.slice(2));
    expect(await a.getAddress()).toBe(await b.getAddress());
  });

  it('signMessage produces a signature that recovers to the signer address', async () => {
    const signer = new PrivateKeySigner(FIXED_PK);
    const msg = 'hello';
    const sig = await signer.signMessage(msg);
    const recovered = ethers.verifyMessage(msg, sig);
    expect(recovered.toLowerCase()).toBe(FIXED_ADDR.toLowerCase());
  });

  it('getPublicKey returns the uncompressed key (65 bytes / 130 hex + 0x)', async () => {
    const signer = new PrivateKeySigner(FIXED_PK);
    const pub = await signer.getPublicKey();
    expect(pub.startsWith('0x04')).toBe(true);
    expect(pub.length).toBe(2 + 130);
  });

  it('pubkey from signer round-trips through ECIES', async () => {
    const signer = new PrivateKeySigner(FIXED_PK);
    const pub = await signer.getPublicKey();
    const plaintext = new TextEncoder().encode('direct-to-signer-pubkey');
    const blob = await eciesEncrypt(plaintext, pub);
    const pt = await eciesDecrypt(blob, FIXED_PK);
    expect(new TextDecoder().decode(pt)).toBe('direct-to-signer-pubkey');
  });

  it('getPublicKey is cached (returns identical string instance)', async () => {
    const signer = new PrivateKeySigner(FIXED_PK);
    const a = await signer.getPublicKey();
    const b = await signer.getPublicKey();
    expect(a).toBe(b);
  });
});

describe('EthersSigner wrapping an arbitrary ethers.Signer', () => {
  it('wraps a provider-less Wallet and passes through signMessage', async () => {
    const wallet = new ethers.Wallet(FIXED_PK);
    const signer = new EthersSigner(wallet);
    const sig = await signer.signMessage('x');
    expect(ethers.verifyMessage('x', sig).toLowerCase()).toBe(FIXED_ADDR.toLowerCase());
  });

  it('chainId throws ConfigError when no provider is attached', async () => {
    const wallet = new ethers.Wallet(FIXED_PK);
    const signer = new EthersSigner(wallet);
    await expect(signer.chainId()).rejects.toMatchObject({ code: 'CONFIG/BAD_CONFIG' });
  });
});
