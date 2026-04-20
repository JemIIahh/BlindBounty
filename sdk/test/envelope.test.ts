import { describe, expect, it } from 'vitest';
import {
  aesDecrypt,
  eciesDecrypt,
  generateKeyPair,
  openEvidenceAsAgent,
  sealEvidence,
  __internals,
} from '../src/crypto/index.js';
import { CryptoError } from '../src/errors/index.js';

describe('evidence envelope', () => {
  it('seal → agent-open round-trips', async () => {
    const agent = generateKeyPair();
    const enclave = generateKeyPair();
    const evidence = new TextEncoder().encode('I did the photography task');
    const { envelope } = await sealEvidence({
      evidence,
      agentPubKey: agent.publicKey,
      enclavePubKey: enclave.publicKey,
    });
    const recovered = await openEvidenceAsAgent(envelope, agent.privateKey);
    expect(new TextDecoder().decode(recovered)).toBe('I did the photography task');
  });

  it('enclave-wrapped key also decrypts to the same AES key', async () => {
    const agent = generateKeyPair();
    const enclave = generateKeyPair();
    const evidence = new TextEncoder().encode('enclave-path');
    const { envelope, aesKey } = await sealEvidence({
      evidence,
      agentPubKey: agent.publicKey,
      enclavePubKey: enclave.publicKey,
    });
    const parsed = __internals.parse(envelope);
    const keyFromEnclave = await eciesDecrypt(parsed.wrappedForEnclave, enclave.privateKey);
    const keyFromAgent = await eciesDecrypt(parsed.wrappedForAgent, agent.privateKey);
    expect(Array.from(keyFromEnclave)).toEqual(Array.from(aesKey));
    expect(Array.from(keyFromAgent)).toEqual(Array.from(aesKey));
    // And the key decrypts the AES portion independently
    const pt = await aesDecrypt(parsed.aesCiphertext, keyFromEnclave);
    expect(new TextDecoder().decode(pt)).toBe('enclave-path');
  });

  it('wrong magic bytes throw CRYPTO/INTEGRITY_CHECK', async () => {
    const agent = generateKeyPair();
    const enclave = generateKeyPair();
    const { envelope } = await sealEvidence({
      evidence: new Uint8Array([1, 2, 3]),
      agentPubKey: agent.publicKey,
      enclavePubKey: enclave.publicKey,
    });
    envelope[0] = 0xff;
    await expect(openEvidenceAsAgent(envelope, agent.privateKey)).rejects.toBeInstanceOf(CryptoError);
  });

  it('unknown version throws CRYPTO/UNSUPPORTED_CIPHER', async () => {
    const agent = generateKeyPair();
    const enclave = generateKeyPair();
    const { envelope } = await sealEvidence({
      evidence: new Uint8Array([1, 2, 3]),
      agentPubKey: agent.publicKey,
      enclavePubKey: enclave.publicKey,
    });
    envelope[2] = 0x99;
    await expect(openEvidenceAsAgent(envelope, agent.privateKey)).rejects.toMatchObject({
      code: 'CRYPTO/UNSUPPORTED_CIPHER',
    });
  });

  it('truncated envelope throws CRYPTO/INTEGRITY_CHECK', async () => {
    const agent = generateKeyPair();
    const enclave = generateKeyPair();
    const { envelope } = await sealEvidence({
      evidence: new Uint8Array([1, 2, 3]),
      agentPubKey: agent.publicKey,
      enclavePubKey: enclave.publicKey,
    });
    const short = envelope.slice(0, 10);
    await expect(openEvidenceAsAgent(short, agent.privateKey)).rejects.toBeInstanceOf(CryptoError);
  });
});
