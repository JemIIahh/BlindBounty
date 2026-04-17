import { useState } from 'react';
import { motion } from 'framer-motion';
import { useWallet } from '../context/WalletContext';
import { useAuth } from '../context/AuthContext';
import { useSubmitEvidence } from '../hooks/useSubmissions';
import { useTxSend } from '../hooks/useTxSend';
import { Button, Input, Textarea } from '../components/ui';
import { TxPendingModal } from '../components/TxPendingModal';
import { downloadBlob, uploadBlob } from '../services/storage';
import {
  aesDecrypt,
  aesEncrypt,
  eciesDecrypt,
  eciesEncrypt,
  generateAesKey,
  sha256,
  toBytes,
  toBase64,
  fromBase64,
  fromBytes,
} from '../lib/crypto';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export default function WorkerView() {
  const { isAuthenticated } = useAuth();
  const { address } = useWallet();
  const txSend = useTxSend();
  const submitEvidence = useSubmitEvidence();

  const [wrappedKeyHex, setWrappedKeyHex] = useState('');
  const [workerPrivKey, setWorkerPrivKey] = useState('');
  const [rootHash, setRootHash] = useState('');
  const [decryptedInstructions, setDecryptedInstructions] = useState<string | null>(null);
  const [decrypting, setDecrypting] = useState(false);

  const [taskId, setTaskId] = useState('');
  const [evidence, setEvidence] = useState('');
  const [agentPubKey, setAgentPubKey] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  if (!isAuthenticated || !address) {
    return (
      <motion.div initial="hidden" animate="visible" variants={fadeUp} className="max-w-md mx-auto text-center py-24">
        <div className="card-dark p-10">
          <div className="w-14 h-14 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-5">
            <svg className="w-7 h-7 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="heading-display text-2xl mb-2">Worker View</h2>
          <p className="text-sm text-neutral-500">Connect your wallet and sign in to view tasks.</p>
        </div>
      </motion.div>
    );
  }

  const handleDecrypt = async () => {
    setDecrypting(true);
    try {
      const wrappedKey = fromBase64(wrappedKeyHex);
      const aesKey = await eciesDecrypt(wrappedKey, workerPrivKey);
      const { data: encryptedB64 } = await downloadBlob(rootHash);
      const encrypted = fromBase64(encryptedB64);
      const plaintext = await aesDecrypt(encrypted, aesKey);
      setDecryptedInstructions(fromBytes(plaintext));
    } catch (err) {
      console.error('Decryption failed:', err);
      alert('Decryption failed. Check your keys and try again.');
    } finally {
      setDecrypting(false);
    }
  };

  const handleSubmitEvidence = async () => {
    if (!evidence.trim() || !taskId || !agentPubKey) return;
    setSubmitting(true);
    try {
      const aesKey = await generateAesKey();
      const encrypted = await aesEncrypt(toBytes(evidence), aesKey);
      const encryptedB64 = toBase64(encrypted);
      await uploadBlob(encryptedB64);
      const evidenceHash = '0x' + await sha256(encrypted);
      const wrappedToAgent = await eciesEncrypt(aesKey, agentPubKey);
      try {
        const stored = JSON.parse(localStorage.getItem('blindbounty_evidence_keys') || '[]');
        stored.push({ taskId, wrappedKey: toBase64(wrappedToAgent), createdAt: new Date().toISOString() });
        localStorage.setItem('blindbounty_evidence_keys', JSON.stringify(stored));
      } catch {
        // localStorage may be unavailable
      }
      submitEvidence.mutate({ taskId, evidenceHash });
      setSubmitSuccess(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div initial="hidden" animate="visible" variants={fadeUp} className="max-w-2xl mx-auto space-y-8">
      <TxPendingModal open={txSend.isPending || submitEvidence.isPending} />

      <div>
        <h1 className="heading-display text-3xl sm:text-4xl mb-2">Worker View</h1>
        <p className="text-sm text-neutral-500">Decrypt instructions and submit evidence</p>
      </div>

      {/* Decrypt Instructions */}
      <div className="card-dark overflow-hidden">
        <div className="px-6 py-4 border-b border-neutral-800 flex items-center gap-2">
          <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <h2 className="text-sm font-semibold text-white">Decrypt Task Instructions</h2>
        </div>
        <div className="px-6 py-6">
          <div className="space-y-4">
            <Input
              label="Root Hash (from agent)"
              placeholder="0x..."
              value={rootHash}
              onChange={(e) => setRootHash(e.target.value)}
            />
            <Input
              label="Wrapped AES Key (base64, from agent)"
              placeholder="Base64-encoded ECIES blob"
              value={wrappedKeyHex}
              onChange={(e) => setWrappedKeyHex(e.target.value)}
            />
            <Input
              label="Your Private Key (hex)"
              placeholder="Private key for ECIES decryption"
              type="password"
              value={workerPrivKey}
              onChange={(e) => setWorkerPrivKey(e.target.value)}
              helperText="Never shared — used only in your browser"
            />
            <Button
              variant="primary"
              loading={decrypting}
              disabled={decrypting || !rootHash || !wrappedKeyHex || !workerPrivKey}
              onClick={handleDecrypt}
            >
              Decrypt Instructions
            </Button>

            {decryptedInstructions && (
              <div className="mt-4 p-5 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                <div className="flex items-center gap-2 mb-3">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    Decrypted
                  </span>
                </div>
                <p className="text-sm text-neutral-300 whitespace-pre-wrap">{decryptedInstructions}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Submit Evidence */}
      <div className="card-dark overflow-hidden">
        <div className="px-6 py-4 border-b border-neutral-800 flex items-center gap-2">
          <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          <h2 className="text-sm font-semibold text-white">Submit Evidence</h2>
        </div>
        <div className="px-6 py-6">
          {submitSuccess ? (
            <div className="text-center py-8">
              <div className="w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-lg font-display text-white mb-1">Evidence submitted successfully!</p>
              <p className="text-sm text-neutral-500">The agent will review your submission.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <Input
                label="Task ID"
                placeholder="e.g., 1"
                value={taskId}
                onChange={(e) => setTaskId(e.target.value)}
              />
              <Textarea
                label="Evidence"
                placeholder="Describe your completed work..."
                value={evidence}
                onChange={(e) => setEvidence(e.target.value)}
                rows={5}
              />
              <Input
                label="Agent's Public Key (hex)"
                placeholder="Uncompressed secp256k1 public key"
                value={agentPubKey}
                onChange={(e) => setAgentPubKey(e.target.value)}
                helperText="For ECIES-wrapping the evidence key to the agent"
              />
              <button
                className="w-full btn-accent py-3"
                disabled={submitting || submitEvidence.isPending || !taskId || !evidence.trim() || !agentPubKey}
                onClick={handleSubmitEvidence}
              >
                {submitting || submitEvidence.isPending ? 'Submitting...' : 'Encrypt & Submit Evidence'}
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
