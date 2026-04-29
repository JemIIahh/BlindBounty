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
type ToolType = 'http' | 'mcp' | 'js';

interface ToolDraft {
  id: string;
  type: ToolType;
  name: string;
  description: string;
  // http
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers: string; // JSON string
  bodyTemplate: string;
  // mcp
  endpointUrl: string;
  toolName: string;
  // js
  code: string;
}

function emptyTool(type: ToolType): ToolDraft {
  return {
    id: crypto.randomUUID(),
    type,
    name: '',
    description: '',
    url: '',
    method: 'GET',
    headers: '',
    bodyTemplate: '',
    endpointUrl: '',
    toolName: '',
    code: 'return input.toUpperCase();',
  };
}

function toolDraftToPayload(t: ToolDraft) {
  const base = { type: t.type, name: t.name, description: t.description };
  if (t.type === 'http') return { ...base, url: t.url, method: t.method, headers: t.headers ? JSON.parse(t.headers) : undefined, bodyTemplate: t.bodyTemplate || undefined };
  if (t.type === 'mcp') return { ...base, endpointUrl: t.endpointUrl, toolName: t.toolName };
  return { ...base, code: t.code };
}

const INPUT_CLS = 'w-full bg-surface-2 border border-line px-3 py-2 text-sm text-ink focus:outline-none focus:border-[var(--bb-cream)]';
const LABEL_CLS = 'block text-xs font-mono text-ink-3 mb-1 uppercase tracking-wider';

export default function DeployAgent() {
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: '', instructions: '', provider: 'openai' as Provider, model: 'gpt-4o-mini', apiKey: '' });
  const [tools, setTools] = useState<ToolDraft[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setForm(f => ({ ...f, model: PROVIDERS[f.provider].models[0] }));
  }, [form.provider]);

  function addTool(type: ToolType) { setTools(t => [...t, emptyTool(type)]); }
  function removeTool(id: string) { setTools(t => t.filter(x => x.id !== id)); }
  function updateTool(id: string, patch: Partial<ToolDraft>) {
    setTools(t => t.map(x => x.id === id ? { ...x, ...patch } : x));
  }

  async function handleDeploy(e: React.FormEvent) {
    e.preventDefault();
    if (!isConnected || !address || !walletClient) { setError('Connect wallet first'); return; }
    setLoading(true); setError('');
    try {
      const msg = 'BlindBounty: authorize agent deployment';
      const sig = await walletClient.signMessage({ message: msg });
      const publicKeyHex = SigningKey.recoverPublicKey(hashMessage(msg), sig);
      const ownerPublicKey = publicKeyHex.startsWith('04') ? publicKeyHex : `04${publicKeyHex}`;

      const res = await fetch('/api/v1/agents/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, ownerAddress: address, ownerPublicKey, tools: tools.map(toolDraftToPayload) }),
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
      <h1 className="heading-display text-2xl mb-1">Deploy an Agent</h1>
      <p className="text-ink-3 mb-8 text-sm font-mono">
        Your agent picks up open tasks, calls your LLM with tools, and submits results automatically.
      </p>

      {!isConnected && <div className="mb-6"><ConnectButton /></div>}

      <form onSubmit={handleDeploy} className="space-y-6">
        {/* Basic config */}
        <div>
          <label className={LABEL_CLS}>Agent name</label>
          <input required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="My Research Agent" className={INPUT_CLS} />
        </div>

        <div>
          <label className={LABEL_CLS}>System instructions</label>
          <textarea required rows={4} value={form.instructions} onChange={e => setForm(f => ({ ...f, instructions: e.target.value }))} placeholder="You are a research agent..." className={`${INPUT_CLS} resize-none`} />
        </div>

        <div>
          <label className={LABEL_CLS}>LLM provider</label>
          <div className="grid grid-cols-4 gap-2">
            {(Object.keys(PROVIDERS) as Provider[]).map(p => (
              <button key={p} type="button" onClick={() => setForm(f => ({ ...f, provider: p }))}
                className={`py-2 border text-xs font-mono font-semibold uppercase tracking-wider transition-colors ${form.provider === p ? 'border-[var(--bb-cream)] text-[var(--bb-cream)] bg-surface-2' : 'border-line text-ink-3 hover:border-line-2'}`}>
                {PROVIDERS[p].label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className={LABEL_CLS}>Model</label>
          <select value={form.model} onChange={e => setForm(f => ({ ...f, model: e.target.value }))} className={INPUT_CLS}>
            {PROVIDERS[form.provider].models.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>

        <div>
          <label className={LABEL_CLS}>{PROVIDERS[form.provider].label} API key</label>
          <input required type="password" value={form.apiKey} onChange={e => setForm(f => ({ ...f, apiKey: e.target.value }))} placeholder="sk-..." className={`${INPUT_CLS} font-mono`} />
          <p className="text-xs text-ink-3 mt-1 font-mono">Encrypted with your wallet key before storage.</p>
        </div>

        {/* Tools builder */}
        <div>
          <div className="section-rule mb-4">
            <span className="section-num">§</span> Tools
          </div>

          {tools.length === 0 && (
            <p className="text-xs text-ink-3 font-mono mb-3">No tools added. Agents can call HTTP endpoints, MCP servers, or run JS snippets.</p>
          )}

          <div className="space-y-4">
            {tools.map(t => (
              <div key={t.id} className="card-dark p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="chip chip-neutral">{t.type}</span>
                  <button type="button" onClick={() => removeTool(t.id)} className="text-xs text-err font-mono hover:underline">remove</button>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className={LABEL_CLS}>Tool name</label>
                    <input value={t.name} onChange={e => updateTool(t.id, { name: e.target.value })} placeholder="search_web" className={INPUT_CLS} />
                  </div>
                  <div>
                    <label className={LABEL_CLS}>Description</label>
                    <input value={t.description} onChange={e => updateTool(t.id, { description: e.target.value })} placeholder="Search the web for information" className={INPUT_CLS} />
                  </div>
                </div>

                {t.type === 'http' && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-3 gap-3">
                      <div className="col-span-2">
                        <label className={LABEL_CLS}>URL</label>
                        <input value={t.url} onChange={e => updateTool(t.id, { url: e.target.value })} placeholder="https://api.example.com/search?q={input}" className={INPUT_CLS} />
                      </div>
                      <div>
                        <label className={LABEL_CLS}>Method</label>
                        <select value={t.method} onChange={e => updateTool(t.id, { method: e.target.value as any })} className={INPUT_CLS}>
                          {['GET','POST','PUT','DELETE'].map(m => <option key={m}>{m}</option>)}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className={LABEL_CLS}>Headers (JSON, optional)</label>
                      <input value={t.headers} onChange={e => updateTool(t.id, { headers: e.target.value })} placeholder='{"Authorization": "Bearer token"}' className={`${INPUT_CLS} font-mono text-xs`} />
                    </div>
                    {t.method !== 'GET' && (
                      <div>
                        <label className={LABEL_CLS}>Body template (optional, use {'{{input}}'})</label>
                        <input value={t.bodyTemplate} onChange={e => updateTool(t.id, { bodyTemplate: e.target.value })} placeholder='{"query": "{{input}}"}' className={`${INPUT_CLS} font-mono text-xs`} />
                      </div>
                    )}
                  </div>
                )}

                {t.type === 'mcp' && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={LABEL_CLS}>MCP endpoint URL</label>
                      <input value={t.endpointUrl} onChange={e => updateTool(t.id, { endpointUrl: e.target.value })} placeholder="https://mcp.example.com" className={INPUT_CLS} />
                    </div>
                    <div>
                      <label className={LABEL_CLS}>Tool name on server</label>
                      <input value={t.toolName} onChange={e => updateTool(t.id, { toolName: e.target.value })} placeholder="search" className={INPUT_CLS} />
                    </div>
                  </div>
                )}

                {t.type === 'js' && (
                  <div>
                    <label className={LABEL_CLS}>JS function body — receives <code className="text-[var(--bb-cream)]">input: string</code>, must return a value</label>
                    <textarea rows={4} value={t.code} onChange={e => updateTool(t.id, { code: e.target.value })} className={`${INPUT_CLS} font-mono text-xs resize-none`} />
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="flex gap-2 mt-3">
            {(['http', 'mcp', 'js'] as ToolType[]).map(type => (
              <button key={type} type="button" onClick={() => addTool(type)}
                className="btn-ghost text-xs">
                + {type.toUpperCase()} tool
              </button>
            ))}
          </div>
        </div>

        {error && <p className="text-sm text-err font-mono">{error}</p>}

        <button type="submit" disabled={loading || !isConnected}
          className="btn-bracket-primary w-full justify-center disabled:opacity-50">
          {loading ? 'Deploying…' : isConnected ? 'Deploy agent' : 'Connect wallet to deploy'}
        </button>
      </form>
    </div>
  );
}
