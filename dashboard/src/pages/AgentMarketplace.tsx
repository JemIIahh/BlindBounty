import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

type AgentStatus = 'stopped' | 'running' | 'paused'

interface DeployedAgent {
  id: string
  ownerAddress: string
  name: string
  provider: string
  model: string
  capabilities: string[]
  status: AgentStatus
  deployedAt: string
}

const STATUS_STYLES: Record<AgentStatus, string> = {
  running: 'bg-green-100 text-green-700',
  paused:  'bg-yellow-100 text-yellow-700',
  stopped: 'bg-gray-100 text-gray-500',
}

export function AgentMarketplace() {
  const { walletAddress } = useAuth()
  const navigate = useNavigate()
  const [agents, setAgents] = useState<DeployedAgent[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const fetchAgents = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/agents')
      const json = await res.json()
      if (json.success) setAgents(json.data)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchAgents() }, [fetchAgents])

  async function action(id: string, verb: 'start' | 'pause' | 'stop') {
    setActionLoading(`${id}:${verb}`)
    try {
      const res = await fetch(`/api/v1/agents/${id}/${verb}`, { method: 'POST' })
      const json = await res.json()
      if (json.success) {
        setAgents(prev => prev.map(a => a.id === id ? json.data : a))
      }
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Agent Marketplace</h1>
          <p className="text-gray-500 text-sm mt-1">All deployed agents on the network</p>
        </div>
        <button
          onClick={() => navigate('/agents/deploy')}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          + Deploy agent
        </button>
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-400">Loading agents…</div>
      ) : agents.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-gray-400 mb-4">No agents deployed yet.</p>
          <button
            onClick={() => navigate('/agents/deploy')}
            className="text-blue-600 underline text-sm"
          >
            Deploy the first one
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {agents.map(agent => {
            const isOwner = walletAddress?.toLowerCase() === agent.ownerAddress?.toLowerCase()
            const busy = actionLoading?.startsWith(agent.id)
            return (
              <div key={agent.id} className="border border-gray-200 rounded-xl p-5 bg-white shadow-sm">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm">{agent.name}</h3>
                    <p className="text-xs text-gray-400 mt-0.5">{agent.provider} · {agent.model}</p>
                  </div>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_STYLES[agent.status]}`}>
                    {agent.status}
                  </span>
                </div>

                {agent.capabilities.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-4">
                    {agent.capabilities.slice(0, 3).map(c => (
                      <span key={c} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                        {c.replace(/_/g, ' ')}
                      </span>
                    ))}
                    {agent.capabilities.length > 3 && (
                      <span className="text-xs text-gray-400">+{agent.capabilities.length - 3}</span>
                    )}
                  </div>
                )}

                <p className="text-xs text-gray-400 mb-4">
                  Deployed {new Date(agent.deployedAt).toLocaleDateString()}
                </p>

                {isOwner && (
                  <div className="flex gap-2">
                    {agent.status !== 'running' && (
                      <button
                        disabled={!!busy}
                        onClick={() => action(agent.id, 'start')}
                        className="flex-1 text-xs font-medium py-1.5 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 disabled:opacity-50 transition-colors"
                      >
                        {busy && actionLoading === `${agent.id}:start` ? '…' : 'Start'}
                      </button>
                    )}
                    {agent.status === 'running' && (
                      <button
                        disabled={!!busy}
                        onClick={() => action(agent.id, 'pause')}
                        className="flex-1 text-xs font-medium py-1.5 rounded-lg bg-yellow-50 text-yellow-700 hover:bg-yellow-100 disabled:opacity-50 transition-colors"
                      >
                        {busy && actionLoading === `${agent.id}:pause` ? '…' : 'Pause'}
                      </button>
                    )}
                    {agent.status !== 'stopped' && (
                      <button
                        disabled={!!busy}
                        onClick={() => action(agent.id, 'stop')}
                        className="flex-1 text-xs font-medium py-1.5 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 disabled:opacity-50 transition-colors"
                      >
                        {busy && actionLoading === `${agent.id}:stop` ? '…' : 'Stop'}
                      </button>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
