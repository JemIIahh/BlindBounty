import { Router } from 'express';
import { z } from 'zod';
import { AGENT_CAPABILITIES, LLM_PROVIDER_MODELS } from '../types.js';
import {
  deployAgent,
  startAgent,
  pauseAgent,
  stopAgent,
  getAgent,
  listAgents,
  getAgentLogs,
  subscribeAgentLogs,
} from '../services/agentRunner.js';

export const agentsRouter = Router();

const PROVIDERS = Object.keys(LLM_PROVIDER_MODELS) as [string, ...string[]];

const DeploySchema = z.object({
  ownerAddress: z.string().min(1),
  ownerPublicKey: z.string().regex(/^04[0-9a-fA-F]{128}$/, 'Must be uncompressed secp256k1 pubkey (04 + 128 hex chars)'),
  name: z.string().min(1).max(80),
  instructions: z.string().min(1),
  provider: z.enum(PROVIDERS),
  model: z.string().min(1),
  apiKey: z.string().min(1),
  capabilities: z.array(z.string()).default([]),
  storageRef: z.string().optional(),
});

// GET /api/v1/agents/providers — list supported providers + models
agentsRouter.get('/providers', (_req, res) => {
  res.json({ success: true, data: LLM_PROVIDER_MODELS });
});

// POST /api/v1/agents/deploy
agentsRouter.post('/deploy', async (req, res) => {
  const parsed = DeploySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, error: parsed.error.flatten() });
    return;
  }
  const agent = await deployAgent(parsed.data as Parameters<typeof deployAgent>[0]);
  // Never return encryptedPrivateKey in the deploy response — use /export-key for that
  const { encryptedPrivateKey: _omit, ...safe } = agent;
  res.status(201).json({ success: true, data: safe });
});

// GET /api/v1/agents
agentsRouter.get('/', (req, res) => {
  const owner = req.query.owner as string | undefined;
  const agents = listAgents(owner).map(({ encryptedPrivateKey: _omit, ...safe }) => safe);
  res.json({ success: true, data: agents });
});

// GET /api/v1/agents/:id/logs — SSE stream of agent logs (must be before /:id)
agentsRouter.get('/:id/logs', (req, res) => {
  const { id } = req.params;
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  // Send buffered history first
  getAgentLogs(id).forEach(line => res.write(`data: ${JSON.stringify(line)}\n\n`));

  // Then stream live
  const unsub = subscribeAgentLogs(id, line => res.write(`data: ${JSON.stringify(line)}\n\n`));
  req.on('close', unsub);
});

// GET /api/v1/agents/:id/wallet — public identity (address + pubkey, no private key)
agentsRouter.get('/:id/wallet', (req, res) => {
  const agent = getAgent(req.params.id);
  if (!agent) { res.status(404).json({ success: false, error: 'Not found' }); return; }
  res.json({
    success: true,
    data: { walletAddress: agent.walletAddress, publicKey: agent.publicKey },
  });
});

// POST /api/v1/agents/:id/export-key — return ECIES-encrypted private key to owner
// The blob is already encrypted to the owner's pubkey — only they can decrypt it
agentsRouter.post('/:id/export-key', (req, res) => {
  const agent = getAgent(req.params.id);
  if (!agent) { res.status(404).json({ success: false, error: 'Not found' }); return; }

  // Caller must prove they are the owner by providing the ownerAddress
  const { ownerAddress } = req.body as { ownerAddress?: string };
  if (!ownerAddress || ownerAddress.toLowerCase() !== agent.ownerAddress.toLowerCase()) {
    res.status(403).json({ success: false, error: 'Forbidden' });
    return;
  }

  res.json({
    success: true,
    data: {
      agentId: agent.id,
      walletAddress: agent.walletAddress,
      encryptedPrivateKey: agent.encryptedPrivateKey, // ECIES blob — only owner can decrypt
    },
  });
});

// GET /api/v1/agents/:id
agentsRouter.get('/:id', (req, res) => {
  const agent = getAgent(req.params.id);
  if (!agent) { res.status(404).json({ success: false, error: 'Not found' }); return; }
  const { encryptedPrivateKey: _omit, ...safe } = agent;
  res.json({ success: true, data: safe });
});

// POST /api/v1/agents/:id/start
agentsRouter.post('/:id/start', (req, res) => {
  try {
    startAgent(req.params.id);
    const { encryptedPrivateKey: _omit, ...safe } = getAgent(req.params.id)!;
    res.json({ success: true, data: safe });
  } catch (e: unknown) {
    res.status(400).json({ success: false, error: (e as Error).message });
  }
});

// POST /api/v1/agents/:id/pause
agentsRouter.post('/:id/pause', (req, res) => {
  try {
    pauseAgent(req.params.id);
    const { encryptedPrivateKey: _omit, ...safe } = getAgent(req.params.id)!;
    res.json({ success: true, data: safe });
  } catch (e: unknown) {
    res.status(400).json({ success: false, error: (e as Error).message });
  }
});

// POST /api/v1/agents/:id/stop
agentsRouter.post('/:id/stop', (req, res) => {
  try {
    stopAgent(req.params.id);
    const { encryptedPrivateKey: _omit, ...safe } = getAgent(req.params.id)!;
    res.json({ success: true, data: safe });
  } catch (e: unknown) {
    res.status(400).json({ success: false, error: (e as Error).message });
  }
});
