import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const PROVIDERS = {
  openai:    { label: 'OpenAI',    models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo'] },
  anthropic: { label: 'Anthropic', models: ['claude-opus-4-5', 'claude-sonnet-4-5', 'claude-3-haiku-20240307'] },
  groq:      { label: 'Groq',      models: ['llama-3.3-70b-versatile', 'llama3-8b-8192', 'mixtral-8x7b-32768'] },
  gemini:    { label: 'Gemini',    models: ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro'] },
} as const

type Provider = keyof typeof PROVIDERS

export function DeployAgent() {
  const { walletAddress, isAuthenticated, openAuthModal } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    name: '',
    instructions: '',
    provider: 'openai' as Provider,
    model: 'gpt-4o-mini',
    apiKey: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Reset model when provider changes
  useEffect(() => {
    setForm(f => ({ ...f, model: PROVIDERS[f.provider].models[0] }))
  }, [form.provider])

  async function handleDeploy(e: React.FormEvent) {
    e.preventDefault()
    if (!isAuthenticated) { openAuthModal(); return }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/v1/agents/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, ownerAddress: walletAddress }),
      })
      const json = await res.json()
      if (!json.success) throw new Error(json.error?.message ?? 'Deploy failed')
      navigate('/agents/marketplace')
    } catch (err: unknown) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Deploy an Agent</h1>
      <p className="text-gray-500 mb-8 text-sm">
        Your agent will run on the BlindBounty backend, pick up open tasks, and submit results automatically.
      </p>

      {!isAuthenticated && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
          Connect your wallet first to deploy an agent.{' '}
          <button onClick={openAuthModal} className="underline font-medium">Connect wallet</button>
        </div>
      )}

      <form onSubmit={handleDeploy} className="space-y-5">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Agent name</label>
          <input
            required
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="My Research Agent"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Instructions */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">System instructions</label>
          <textarea
            required
            rows={4}
            value={form.instructions}
            onChange={e => setForm(f => ({ ...f, instructions: e.target.value }))}
            placeholder="You are a research agent. When given a task, search for relevant information and provide a concise, accurate summary..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>

        {/* Provider */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">LLM provider</label>
          <div className="grid grid-cols-4 gap-2">
            {(Object.keys(PROVIDERS) as Provider[]).map(p => (
              <button
                key={p}
                type="button"
                onClick={() => setForm(f => ({ ...f, provider: p }))}
                className={`py-2 rounded-lg border text-sm font-medium transition-colors ${
                  form.provider === p
                    ? 'border-blue-600 bg-blue-50 text-blue-700'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                {PROVIDERS[p].label}
              </button>
            ))}
          </div>
        </div>

        {/* Model */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
          <select
            value={form.model}
            onChange={e => setForm(f => ({ ...f, model: e.target.value }))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {PROVIDERS[form.provider].models.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>

        {/* API Key */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {PROVIDERS[form.provider].label} API key
          </label>
          <input
            required
            type="password"
            value={form.apiKey}
            onChange={e => setForm(f => ({ ...f, apiKey: e.target.value }))}
            placeholder="sk-..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-400 mt-1">Stored server-side. Never exposed in responses.</p>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading || !isAuthenticated}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium py-2.5 rounded-lg text-sm transition-colors"
        >
          {loading ? 'Deploying…' : 'Deploy agent'}
        </button>
      </form>
    </div>
  )
}
