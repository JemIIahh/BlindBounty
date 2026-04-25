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
} from '../services/agentRunner.js';

export const agentsRouter = Router();

const PROVIDERS = Object.keys(LLM_PROVIDER_MODELS) as [string, ...string[]];

const DeploySchema = z.object({
  ownerAddress: z.string().min(1),
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
agentsRouter.post('/deploy', (req, res) => {
  const parsed = DeploySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ success: false, error: parsed.error.flatten() });
    return;
  }
  const agent = deployAgent(parsed.data as Parameters<typeof deployAgent>[0]);
  res.status(201).json({ success: true, data: agent });
});

// GET /api/v1/agents
agentsRouter.get('/', (req, res) => {
  const owner = req.query.owner as string | undefined;
  res.json({ success: true, data: listAgents(owner) });
});

// GET /api/v1/agents/:id
agentsRouter.get('/:id', (req, res) => {
  const agent = getAgent(req.params.id);
  if (!agent) { res.status(404).json({ success: false, error: 'Not found' }); return; }
  res.json({ success: true, data: agent });
});

// POST /api/v1/agents/:id/start
agentsRouter.post('/:id/start', (req, res) => {
  try {
    startAgent(req.params.id);
    res.json({ success: true, data: getAgent(req.params.id) });
  } catch (e: unknown) {
    res.status(400).json({ success: false, error: (e as Error).message });
  }
});

// POST /api/v1/agents/:id/pause
agentsRouter.post('/:id/pause', (req, res) => {
  try {
    pauseAgent(req.params.id);
    res.json({ success: true, data: getAgent(req.params.id) });
  } catch (e: unknown) {
    res.status(400).json({ success: false, error: (e as Error).message });
  }
});

// POST /api/v1/agents/:id/stop
agentsRouter.post('/:id/stop', (req, res) => {
  try {
    stopAgent(req.params.id);
    res.json({ success: true, data: getAgent(req.params.id) });
  } catch (e: unknown) {
    res.status(400).json({ success: false, error: (e as Error).message });
  }
});
