import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAccount, useWalletClient } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { SigningKey, hashMessage } from 'ethers';

const PROVIDERS = {
  openai:    { label: 'OpenAI',    models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo'] },
  anthropic: { label: 'Anthropic', models: ['claude-opus-4-5', 'claude-sonnet-4-5', 'claude-3-haiku-20240307'] },
  groq:      { label: 'Groq',      models: ['llama-3.3-70b-versatile', 'llama3-8b-8192', 'mixtral-8x7b-32768'] },
  gemini:    { label: 'Gemini',    models: ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro'] },
} as const;

type Provider = keyof typeof PROVIDERS;

export default function DeployAgent() {
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    instructions: '',
    provider: 'openai' as Provider,
    model: 'gpt-4o-mini',
    apiKey: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setForm(f => ({ ...f, model: PROVIDERS[f.provider].models[0] }));
  }, [form.provider]);

  async function handleDeploy(e: React.FormEvent) {
    e.preventDefault();
    if (!isConnected || !address) { 
      setError('Please connect your wallet first');
      return; 
    }
    setLoading(true);
    setError('');
    try {
      // Derive the owner's real secp256k1 public key by recovering it from a signature
      if (!walletClient) throw new Error('Wallet client not ready');
      const msg = 'BlindBounty: authorize agent deployment';
      const sig = await walletClient.signMessage({ message: msg });
      const publicKeyHex = SigningKey.recoverPublicKey(hashMessage(msg), sig).slice(2); // remove 0x04 prefix? No — keep full uncompressed

      const res = await fetch('/api/v1/agents/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ...form, 
          ownerAddress: address,
          ownerPublicKey: publicKeyHex.startsWith('04') ? publicKeyHex : `04${publicKeyHex}`,
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message ?? 'Deploy failed');
      navigate('/agents');
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-white mb-1">Deploy an Agent</h1>
      <p className="text-gray-400 mb-8 text-sm">
        Your agent will pick up open tasks, call your LLM, and submit results automatically.
      </p>

      {!isConnected && (
        <div className="mb-6 p-4 bg-yellow-900/30 border border-yellow-700 rounded-lg text-sm text-yellow-300">
          Connect your wallet first.{' '}
          <ConnectButton />
        </div>
      )}

      <form onSubmit={handleDeploy} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Agent name</label>
          <input
            required
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="My Research Agent"
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">System instructions</label>
          <textarea
            required
            rows={4}
            value={form.instructions}
            onChange={e => setForm(f => ({ ...f, instructions: e.target.value }))}
            placeholder="You are a research agent. When given a task, provide a concise, accurate response..."
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">LLM provider</label>
          <div className="grid grid-cols-4 gap-2">
            {(Object.keys(PROVIDERS) as Provider[]).map(p => (
              <button
                key={p}
                type="button"
                onClick={() => setForm(f => ({ ...f, provider: p }))}
                className={`py-2 rounded-lg border text-sm font-medium transition-colors ${
                  form.provider === p
                    ? 'border-blue-500 bg-blue-900/40 text-blue-300'
                    : 'border-gray-700 text-gray-400 hover:border-gray-500'
                }`}
              >
                {PROVIDERS[p].label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Model</label>
          <select
            value={form.model}
            onChange={e => setForm(f => ({ ...f, model: e.target.value }))}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {PROVIDERS[form.provider].models.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">
            {PROVIDERS[form.provider].label} API key
          </label>
          <input
            required
            type="password"
            value={form.apiKey}
            onChange={e => setForm(f => ({ ...f, apiKey: e.target.value }))}
            placeholder="sk-..."
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">Stored server-side only.</p>
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={loading || !isConnected}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium py-2.5 rounded-lg text-sm transition-colors"
        >
          {loading ? 'Deploying…' : isConnected ? 'Deploy agent' : 'Connect wallet to deploy'}
        </button>
      </form>
    </div>
  );
}
