import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import * as agentStore from '../services/agentStore.js';
import * as a2aStore from '../services/a2aStore.js';
import { autoVerify } from '../services/autoVerify.js';
import type { AuthRequest, ApiResponse, AgentCapability } from '../types.js';
import { AGENT_CAPABILITIES } from '../types.js';

export const a2aRouter = Router();

// --- Schemas ---

const registerSchema = z.object({
  displayName: z.string().min(1).max(100),
  capabilities: z.array(z.enum(AGENT_CAPABILITIES as unknown as [string, ...string[]])).min(1).max(20),
  agentCardUrl: z.string().url().optional(),
  mcpEndpointUrl: z.string().url().optional(),
});

const submitSchema = z.object({
  resultData: z.record(z.unknown()),
});

/**
 * POST /api/v1/a2a/register
 * Register as an agent executor.
 */
a2aRouter.post('/register', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const data = registerSchema.parse(req.body);
    const address = req.user!.address;

    const existing = agentStore.getAgent(address);

    agentStore.registerAgent({
      address,
      displayName: data.displayName,
      capabilities: data.capabilities as AgentCapability[],
      agentCardUrl: data.agentCardUrl,
      mcpEndpointUrl: data.mcpEndpointUrl,
      reputation: existing?.reputation ?? 50, // start at 50
      tasksCompleted: existing?.tasksCompleted ?? 0,
      registeredAt: existing?.registeredAt ?? new Date().toISOString(),
    });

    const body: ApiResponse = {
      success: true,
      data: { agent: agentStore.getAgent(address) },
    };
    res.status(existing ? 200 : 201).json(body);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/a2a/tasks
 * Browse agent-targeted tasks (filter by capabilities, minReputation).
 */
a2aRouter.get('/tasks', async (req, res, next) => {
  try {
    const caps = req.query.capabilities
      ? (req.query.capabilities as string).split(',').filter(Boolean) as AgentCapability[]
      : undefined;
    const minRep = req.query.minReputation ? parseInt(req.query.minReputation as string) : undefined;

    const tasks = a2aStore.browseAgentTasks(caps, minRep);

    const body: ApiResponse = {
      success: true,
      data: { tasks, total: tasks.length },
    };
    res.json(body);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/a2a/tasks/:id/accept
 * Accept a task (capability match + reputation gate).
 */
a2aRouter.post('/tasks/:id/accept', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const taskId = req.params.id as string;
    const address = req.user!.address;

    const meta = a2aStore.getMeta(taskId);
    if (!meta) throw new AppError(404, 'NOT_FOUND', 'Task not found or not A2A-enabled');

    const state = a2aStore.getState(taskId);
    if (!state || state.status !== 'open') {
      throw new AppError(409, 'NOT_OPEN', 'Task is not open for acceptance');
    }

    // Check agent is registered
    const agent = agentStore.getAgent(address);
    if (!agent) {
      throw new AppError(403, 'NOT_REGISTERED', 'Register as an agent executor first');
    }

    // Capability match
    if (meta.requiredCapabilities.length > 0) {
      const missing = meta.requiredCapabilities.filter((c) => !agent.capabilities.includes(c));
      if (missing.length > 0) {
        throw new AppError(403, 'CAPABILITY_MISMATCH', `Missing capabilities: ${missing.join(', ')}`);
      }
    }

    a2aStore.updateState(taskId, {
      status: 'accepted',
      executorAddress: address,
      acceptedAt: new Date().toISOString(),
    });

    const body: ApiResponse = {
      success: true,
      data: { taskId, status: 'accepted' },
    };
    res.json(body);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/a2a/tasks/:id/submit
 * Submit structured work (auto-verify if mode=auto).
 */
a2aRouter.post('/tasks/:id/submit', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const taskId = req.params.id as string;
    const address = req.user!.address;
    const { resultData } = submitSchema.parse(req.body);

    const meta = a2aStore.getMeta(taskId);
    if (!meta) throw new AppError(404, 'NOT_FOUND', 'Task not found or not A2A-enabled');

    const state = a2aStore.getState(taskId);
    if (!state || state.executorAddress !== address) {
      throw new AppError(403, 'FORBIDDEN', 'Only the accepted executor can submit');
    }
    if (state.status !== 'accepted' && state.status !== 'in_progress') {
      throw new AppError(409, 'INVALID_STATE', `Cannot submit in state: ${state.status}`);
    }

    let verificationResult: { passed: boolean; reasons: string[] } | undefined;
    let newStatus: 'submitted' | 'verified' | 'failed' = 'submitted';

    // Auto-verify if mode=auto and criteria present
    if (meta.verificationMode === 'auto' && meta.verificationCriteria) {
      verificationResult = autoVerify(resultData, meta.verificationCriteria);
      newStatus = verificationResult.passed ? 'verified' : 'failed';

      // Bump reputation on success
      if (verificationResult.passed) {
        const agent = agentStore.getAgent(address);
        if (agent) {
          agent.tasksCompleted += 1;
          agent.reputation = Math.min(100, agent.reputation + 1);
          agentStore.registerAgent(agent);
        }
      }
    }

    a2aStore.updateState(taskId, {
      status: newStatus,
      resultData,
      submittedAt: new Date().toISOString(),
      verificationResult,
    });

    const body: ApiResponse = {
      success: true,
      data: {
        taskId,
        status: newStatus,
        verificationResult: verificationResult ?? null,
      },
    };
    res.json(body);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/a2a/executions
 * List my accepted/completed tasks.
 */
a2aRouter.get('/executions', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const address = req.user!.address;
    const tasks = a2aStore.getExecutorTasks(address);

    const body: ApiResponse = {
      success: true,
      data: { executions: tasks, total: tasks.length },
    };
    res.json(body);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/a2a/profile
 * Get my agent profile.
 */
a2aRouter.get('/profile', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const address = req.user!.address;
    const agent = agentStore.getAgent(address);

    if (!agent) {
      throw new AppError(404, 'NOT_REGISTERED', 'Agent not registered');
    }

    const body: ApiResponse = {
      success: true,
      data: { agent },
    };
    res.json(body);
  } catch (err) {
    next(err);
  }
});
