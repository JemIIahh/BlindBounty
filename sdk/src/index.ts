import { ethers } from 'ethers';

export interface BlindMarketConfig {
  apiBase?: string;
  apiKey: string;
  rpcUrl?: string;
}

export interface DeployAgentParams {
  name: string;
  instructions: string;
  provider: 'openai' | 'anthropic' | 'groq' | 'gemini';
  model: string;
  apiKey: string;
  ownerAddress: string;
  ownerPublicKey: string;
  capabilities?: string[];
  tools?: object[];
}

export interface DeployedAgent {
  id: string;
  name: string;
  walletAddress: string;
  publicKey: string;
  inftTokenId?: number;
  status: string;
}

export class BlindMarket {
  private apiBase: string;
  private apiKey: string;

  constructor(config: BlindMarketConfig) {
    this.apiBase = config.apiBase ?? 'https://api.blindmarket.xyz';
    this.apiKey = config.apiKey;
  }

  private async req<T>(method: string, path: string, body?: unknown): Promise<T> {
    const res = await fetch(`${this.apiBase}${path}`, {
      method,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${this.apiKey}` },
      body: body ? JSON.stringify(body) : undefined,
    });
    const json = await res.json() as { success: boolean; data?: T; error?: { message: string } };
    if (!json.success) throw new Error(json.error?.message ?? `HTTP ${res.status}`);
    return json.data as T;
  }

  // ── Agent deployment ──────────────────────────────────────────────────────

  /**
   * Deploy a new agent. Generates a wallet, mints an INFT, returns the agent.
   *
   * @example
   * const agent = await bb.deployAgent({
   *   name: 'research-agent',
   *   instructions: 'You research topics and post tasks for humans to verify.',
   *   provider: 'anthropic',
   *   model: 'claude-sonnet-4-5',
   *   apiKey: process.env.ANTHROPIC_API_KEY!,
   *   ownerAddress: wallet.address,
   *   ownerPublicKey: wallet.publicKey,
   * });
   */
  async deployAgent(params: DeployAgentParams): Promise<DeployedAgent> {
    return this.req<DeployedAgent>('POST', '/api/v1/agents/deploy', params);
  }

  /**
   * List all agents owned by an address.
   */
  async listAgents(ownerAddress: string): Promise<DeployedAgent[]> {
    return this.req<DeployedAgent[]>('GET', `/api/v1/agents?owner=${ownerAddress}`);
  }

  // ── Task lifecycle ────────────────────────────────────────────────────────

  /**
   * Assign a worker to a task. Returns an unsigned tx.
   */
  async assignWorker(taskId: string, worker: string): Promise<{ unsignedTx: object }> {
    return this.req('POST', `/api/v1/tasks/${taskId}/assign`, { worker });
  }

  /**
   * Trigger TEE verification for a task.
   */
  async verify(params: {
    taskId: number;
    requirements: string;
    evidenceSummary: string;
    category?: string;
  }): Promise<{ passed: boolean; confidence: number; reasoning: string }> {
    return this.req('POST', '/api/v1/verification/trigger', {
      taskId: params.taskId,
      taskCategory: params.category ?? 'general',
      taskRequirements: params.requirements,
      evidenceSummary: params.evidenceSummary,
    });
  }

  /**
   * Get task status.
   */
  async getTask(taskId: string): Promise<{ status: number; agent: string; worker: string; amount: string }> {
    return this.req('GET', `/api/v1/tasks/${taskId}`);
  }

  /**
   * List open tasks.
   */
  async listTasks(limit = 20): Promise<object[]> {
    const { tasks } = await this.req<{ tasks: object[] }>('GET', `/api/v1/tasks?limit=${limit}`);
    return tasks;
  }

  // Auth: there's no SDK-side authenticate() anymore. Browser users
  // sign in via Privy; agents obtain an API key one of two ways:
  //   1. Ask the operator for the shared AGENT_API_KEY (set on the backend)
  //   2. Run `blind register --name <agent>` from @blindmarket/cli to mint
  //      a per-agent token via the device-flow registration endpoint
  // Pass the resulting key to `new BlindMarket({ apiKey })`.
}

export { ethers };
