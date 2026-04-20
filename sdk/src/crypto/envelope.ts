import { CryptoError } from '../errors/index.js';
import { aesDecrypt, aesEncrypt, generateAesKey } from './aes.js';
import { eciesEncrypt } from './ecies.js';

/**
 * Evidence envelope — the single blob a worker uploads to Storage containing:
 *   1. The AES key wrapped to the agent's pubkey (so agent can decrypt later)
 *   2. The AES key wrapped to the TEE enclave's pubkey (so Sealed Inference can decrypt)
 *   3. The evidence ciphertext under that AES key
 *
 * Wire format (big-endian):
 *   bytes 0..1    magic         = 0x42 0x42  ("BB")
 *   byte  2       version       = 0x01
 *   bytes 3..6    wrappedAgentLen (uint32)
 *   bytes 7..     wrappedAgent  (ECIES blob)
 *   4-byte uint32 wrappedEnclaveLen
 *   bytes         wrappedEnclave (ECIES blob)
 *   bytes         aesCiphertext  (rest of the blob — AES blob [IV||tag||ct])
 *
 * The layout is versioned so we can rev it without breaking old blobs.
 */

const MAGIC_0 = 0x42;
const MAGIC_1 = 0x42;
const VERSION = 0x01;
const HEADER_LEN = 3;

export interface EvidenceEnvelope {
  wrappedForAgent: Uint8Array;
  wrappedForEnclave: Uint8Array;
  aesCiphertext: Uint8Array;
}

export interface SealEvidenceInput {
  evidence: Uint8Array;
  agentPubKey: string;
  enclavePubKey: string;
}

export interface SealEvidenceOutput {
  envelope: Uint8Array;
  aesKey: Uint8Array;
}

/**
 * Seal evidence for the agent + TEE enclave. Generates a fresh AES key,
 * encrypts the evidence, ECIES-wraps the key twice, and concatenates the
 * result as an EvidenceEnvelope. Returns both the on-wire envelope and
 * the raw AES key (for audit / diagnostic use — do NOT persist beyond
 * the submission).
 */
export async function sealEvidence(input: SealEvidenceInput): Promise<SealEvidenceOutput> {
  const aesKey = await generateAesKey();
  const aesCiphertext = await aesEncrypt(input.evidence, aesKey);
  const wrappedForAgent = await eciesEncrypt(aesKey, input.agentPubKey);
  const wrappedForEnclave = await eciesEncrypt(aesKey, input.enclavePubKey);
  const envelope = pack({ wrappedForAgent, wrappedForEnclave, aesCiphertext });
  return { envelope, aesKey };
}

/**
 * Open an evidence envelope as the agent — extracts the AES key wrapped
 * to the agent's pubkey, decrypts the ciphertext, and returns the plaintext
 * evidence. The enclave-wrapped key is ignored by agents (TEE-only).
 */
export async function openEvidenceAsAgent(
  envelope: Uint8Array,
  agentPrivKey: string,
): Promise<Uint8Array> {
  const parsed = parse(envelope);
  const { eciesDecrypt } = await import('./ecies.js');
  const aesKey = await eciesDecrypt(parsed.wrappedForAgent, agentPrivKey);
  return aesDecrypt(parsed.aesCiphertext, aesKey);
}

function pack(parts: EvidenceEnvelope): Uint8Array {
  const { wrappedForAgent, wrappedForEnclave, aesCiphertext } = parts;
  const total =
    HEADER_LEN +
    4 + wrappedForAgent.byteLength +
    4 + wrappedForEnclave.byteLength +
    aesCiphertext.byteLength;
  const out = new Uint8Array(total);
  const view = new DataView(out.buffer);
  let off = 0;
  out[off++] = MAGIC_0;
  out[off++] = MAGIC_1;
  out[off++] = VERSION;
  view.setUint32(off, wrappedForAgent.byteLength, false);
  off += 4;
  out.set(wrappedForAgent, off);
  off += wrappedForAgent.byteLength;
  view.setUint32(off, wrappedForEnclave.byteLength, false);
  off += 4;
  out.set(wrappedForEnclave, off);
  off += wrappedForEnclave.byteLength;
  out.set(aesCiphertext, off);
  return out;
}

function parse(blob: Uint8Array): EvidenceEnvelope {
  if (blob.byteLength < HEADER_LEN + 4 + 4) {
    throw new CryptoError('CRYPTO/INTEGRITY_CHECK', `envelope too short: ${blob.byteLength}`);
  }
  if (blob[0] !== MAGIC_0 || blob[1] !== MAGIC_1) {
    throw new CryptoError('CRYPTO/INTEGRITY_CHECK', 'bad envelope magic');
  }
  if (blob[2] !== VERSION) {
    throw new CryptoError('CRYPTO/UNSUPPORTED_CIPHER', `unknown envelope version ${blob[2]}`);
  }
  const view = new DataView(blob.buffer, blob.byteOffset, blob.byteLength);
  let off = HEADER_LEN;
  const agentLen = view.getUint32(off, false);
  off += 4;
  if (off + agentLen + 4 > blob.byteLength) {
    throw new CryptoError('CRYPTO/INTEGRITY_CHECK', 'envelope truncated (agent)');
  }
  const wrappedForAgent = blob.slice(off, off + agentLen);
  off += agentLen;
  const enclaveLen = view.getUint32(off, false);
  off += 4;
  if (off + enclaveLen > blob.byteLength) {
    throw new CryptoError('CRYPTO/INTEGRITY_CHECK', 'envelope truncated (enclave)');
  }
  const wrappedForEnclave = blob.slice(off, off + enclaveLen);
  off += enclaveLen;
  const aesCiphertext = blob.slice(off);
  return { wrappedForAgent, wrappedForEnclave, aesCiphertext };
}

export const __internals = { pack, parse };
