import { useState } from 'react';
import { useWallet } from '../context/WalletContext';
import { useAuth } from '../context/AuthContext';
import { useTxSend } from '../hooks/useTxSend';
import { Card, CardHeader, CardBody, Button, Input, Textarea, Select } from '../components/ui';
import { TxPendingModal } from '../components/TxPendingModal';
import { buildCreateTask } from '../services/tasks';
import { uploadBlob } from '../services/storage';
import {
  generateAesKey,
  aesEncrypt,
  eciesEncrypt,
  sha256,
  toBytes,
  toBase64,
  generateKeyPair,
} from '../lib/crypto';

const categories = [
  { value: 'physical_presence', label: 'Physical Presence' },
  { value: 'knowledge_access', label: 'Knowledge Access' },
  { value: 'human_authority', label: 'Human Authority' },
  { value: 'simple_action', label: 'Simple Action' },
  { value: 'digital_physical', label: 'Digital-Physical' },
];

export default function AgentDashboard() {
  const { address } = useWallet();
  const { isAuthenticated } = useAuth();
  const txSend = useTxSend();

  const [instructions, setInstructions] = useState('');
  const [category, setCategory] = useState('simple_action');
  const [locationZone, setLocationZone] = useState('');
  const [amount, setAmount] = useState('');
  const [token, setToken] = useState('');
  const [duration, setDuration] = useState('86400'); // 24h default
  const [creating, setCreating] = useState(false);
  const [createdId, setCreatedId] = useState<string | null>(null);

  if (!isAuthenticated || !address) {
    return (
      <div className="text-center py-20">
        <h2 className="text-xl font-bold text-neutral-950 mb-2">Agent Dashboard</h2>
        <p className="text-neutral-400">Connect your wallet and sign in to create tasks.</p>
      </div>
    );
  }

  const handleCreate = async () => {
    if (!instructions.trim() || !amount || !token) return;
    setCreating(true);
    try {
      // 1. Generate agent keypair (for self-backup)
      const agentKeys = generateKeyPair();

      // 2. Encrypt instructions
      const aesKey = await generateAesKey();
      const encrypted = await aesEncrypt(toBytes(instructions), aesKey);
      const encryptedB64 = toBase64(encrypted);

      // 3. Upload encrypted blob
      const { rootHash } = await uploadBlob(encryptedB64);

      // 4. Compute taskHash
      const taskHash = '0x' + await sha256(encrypted);

      // 5. ECIES-wrap AES key to self
      const wrappedKey = await eciesEncrypt(aesKey, agentKeys.publicKey);

      // 6. Build unsigned tx
      const unsignedTx = await buildCreateTask({
        taskHash,
        token,
        amount,
        category,
        locationZone,
        duration,
      });

      // 7. Sign and send
      const receipt = await new Promise<{ hash: string }>((resolve, reject) => {
        txSend.mutate(unsignedTx, {
          onSuccess: (r) => resolve({ hash: r.hash }),
          onError: reject,
        });
      });

      // Store encryption keys in localStorage (agent's responsibility to back up)
      // NEVER log private keys to console
      const taskData = {
        taskHash,
        rootHash,
        wrappedKey: toBase64(wrappedKey),
        agentPublicKey: agentKeys.publicKey,
        txHash: receipt.hash,
      };
      try {
        const stored = JSON.parse(localStorage.getItem('blindbounty_tasks') || '[]');
        stored.push({
          ...taskData,
          agentPrivateKey: agentKeys.privateKey,
          createdAt: new Date().toISOString(),
        });
        localStorage.setItem('blindbounty_tasks', JSON.stringify(stored));
      } catch {
        // localStorage may be unavailable — silently degrade
      }
      setCreatedId(rootHash);
      setInstructions('');
      setAmount('');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <TxPendingModal open={txSend.isPending} />

      <h1 className="text-2xl font-bold text-neutral-950 mb-6">Agent Dashboard</h1>

      {createdId && (
        <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-4 mb-6">
          <p className="text-sm text-neutral-600">
            Task created successfully! Root hash: <code className="text-xs text-neutral-950">{createdId}</code>
          </p>
        </div>
      )}

      <Card>
        <CardHeader title="Create Encrypted Task" bordered />
        <CardBody>
          <div className="space-y-4">
            <Textarea
              label="Task Instructions"
              placeholder="Describe what the worker needs to do..."
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              rows={5}
              required
              helperText="Instructions will be AES-256 encrypted before upload"
            />

            <Select
              label="Category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              options={categories}
            />

            <Input
              label="Location Zone"
              placeholder="e.g., US-NY, EU-DE, Global"
              value={locationZone}
              onChange={(e) => setLocationZone(e.target.value)}
            />

            <Input
              label="Token Address"
              placeholder="0x..."
              value={token}
              onChange={(e) => setToken(e.target.value)}
              required
              helperText="ERC-20 token used for escrow payment"
            />

            <Input
              label="Amount (in wei)"
              placeholder="1000000000000000000"
              type="text"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />

            <Input
              label="Duration (seconds)"
              placeholder="86400"
              type="text"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              helperText="Time allowed for task completion (default: 24h)"
            />

            <Button
              variant="primary"
              fullWidth
              loading={creating || txSend.isPending}
              disabled={creating || txSend.isPending || !instructions.trim() || !amount || !token}
              onClick={handleCreate}
            >
              Create Encrypted Task
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
