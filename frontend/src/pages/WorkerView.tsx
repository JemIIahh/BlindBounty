import { useState } from 'react';
import { useWallet } from '../context/WalletContext';
import { useAuth } from '../context/AuthContext';
import { useSubmitEvidence } from '../hooks/useSubmissions';
import { useTxSend } from '../hooks/useTxSend';
import { Card, CardHeader, CardBody, Button, Input, Textarea } from '../components/ui';
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

export default function WorkerView() {
  const { isAuthenticated } = useAuth();
  const { address } = useWallet();
  const txSend = useTxSend();
  const submitEvidence = useSubmitEvidence();

  // Decrypt section
  const [wrappedKeyHex, setWrappedKeyHex] = useState('');
  const [workerPrivKey, setWorkerPrivKey] = useState('');
  const [rootHash, setRootHash] = useState('');
  const [decryptedInstructions, setDecryptedInstructions] = useState<string | null>(null);
  const [decrypting, setDecrypting] = useState(false);

  // Submit section
  const [taskId, setTaskId] = useState('');
  const [evidence, setEvidence] = useState('');
  const [agentPubKey, setAgentPubKey] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  if (!isAuthenticated || !address) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl font-bold text-neutral-950 mb-2">Worker View</h2>
        <p className="text-neutral-400">Connect your wallet and sign in to view tasks.</p>
      </div>
    );
  }

  const handleDecrypt = async () => {
    setDecrypting(true);
    try {
      // 1. ECIES-decrypt the wrapped AES key
      const wrappedKey = fromBase64(wrappedKeyHex);
      const aesKey = await eciesDecrypt(wrappedKey, workerPrivKey);

      // 2. Download encrypted blob
      const { data: encryptedB64 } = await downloadBlob(rootHash);
      const encrypted = fromBase64(encryptedB64);

      // 3. AES-decrypt
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
      // 1. Generate new AES key for evidence
      const aesKey = await generateAesKey();
      const encrypted = await aesEncrypt(toBytes(evidence), aesKey);
      const encryptedB64 = toBase64(encrypted);

      // 2. Upload encrypted evidence
      await uploadBlob(encryptedB64);

      // 3. Compute evidence hash
      const evidenceHash = '0x' + await sha256(encrypted);

      // 4. ECIES-wrap AES key to agent
      const wrappedToAgent = await eciesEncrypt(aesKey, agentPubKey);

      // 5. Build and send tx — include wrapped key for agent
      console.log('Wrapped AES key for agent:', toBase64(wrappedToAgent));
      submitEvidence.mutate({ taskId, evidenceHash });
      setSubmitSuccess(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <TxPendingModal open={txSend.isPending || submitEvidence.isPending} />

      <h1 className="text-2xl font-bold text-neutral-950">Worker View</h1>

      {/* Decrypt Instructions */}
      <Card>
        <CardHeader title="Decrypt Task Instructions" bordered />
        <CardBody>
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
              disabled={!rootHash || !wrappedKeyHex || !workerPrivKey}
              onClick={handleDecrypt}
            >
              Decrypt Instructions
            </Button>

            {decryptedInstructions && (
              <div className="mt-4 p-4 rounded-lg bg-neutral-950 border border-neutral-800">
                <h4 className="text-xs font-semibold text-neutral-500 uppercase mb-2">Decrypted Instructions</h4>
                <p className="text-sm text-white whitespace-pre-wrap">{decryptedInstructions}</p>
              </div>
            )}
          </div>
        </CardBody>
      </Card>

      {/* Submit Evidence */}
      <Card>
        <CardHeader title="Submit Evidence" bordered />
        <CardBody>
          {submitSuccess ? (
            <div className="text-center py-4">
              <p className="text-neutral-400 font-semibold">Evidence submitted successfully!</p>
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
              <Button
                variant="primary"
                fullWidth
                loading={submitting}
                disabled={!taskId || !evidence.trim() || !agentPubKey}
                onClick={handleSubmitEvidence}
              >
                Encrypt & Submit Evidence
              </Button>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
