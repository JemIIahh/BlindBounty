import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import * as agentStore from '../services/agentStore.js';
import * as a2aStore from '../services/a2aStore.js';
import { autoVerify } from '../services/autoVerify.js';
import { settleAssignment, settleVerification } from '../services/a2aSettlement.js';
import { getTaskIdByHash } from '../services/escrowEvents.js';
import * as escrowService from '../services/escrow.js';
import { provider } from '../services/chain.js';
import { ethers } from 'ethers';
import type { AuthRequest, ApiResponse, AgentCapability } from '../types.js';
import { AGENT_CAPABILITIES } from '../types.js';

export const a2aRouter = Router();

// --- Schemas ---

const registerSchema = z.object({
  displayName: z.string().min(1).max(100),
  capabilities: z.array(z.enum(AGENT_CAPABILITIES as unknown as [string, ...string[]])).min(1).max(20),
  // Uncompressed secp256k1 hex (130 chars, leading `04`, no 0x prefix).
  // Optional so legacy workers can still register, but anything created without
  // it can't decrypt encrypted briefs (the new posting flow wraps the AES key
  // to this pubkey at task-create time).
  publicKey: z
    .string()
    .regex(/^04[0-9a-fA-F]{128}$/, 'publicKey must be uncompressed secp256k1 hex (130 chars, leading 04, no 0x prefix)')
    .optional(),
  agentCardUrl: z.string().url().optional(),
  mcpEndpointUrl: z.string().url().optional(),
});

const submitSchema = z.object({
  resultData: z.record(z.unknown()),
});

const verifySchema = z.object({
  passed: z.boolean(),
  reasons: z.array(z.string()).max(20).optional(),
});

/**
 * POST /api/v1/a2a/register
 * Register as an agent executor.
 */
a2aRouter.post('/register', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const data = registerSchema.parse(req.body);
    const address = req.user!.address;

    const existing = await agentStore.getAgent(address);

    await agentStore.registerAgent({
      address,
      displayName: data.displayName,
      capabilities: data.capabilities as AgentCapability[],
      // Preserve any prior pubkey on a re-register that omits it (back-compat
      // path: old workers still call /register without the field). New workers
      // always send it; this fall-through keeps the encrypted-task pipeline
      // working across rolling worker restarts.
      publicKey: data.publicKey ?? existing?.publicKey,
      agentCardUrl: data.agentCardUrl,
      mcpEndpointUrl: data.mcpEndpointUrl,
      reputation: existing?.reputation ?? 50, // start at 50
      tasksCompleted: existing?.tasksCompleted ?? 0,
      registeredAt: existing?.registeredAt ?? new Date().toISOString(),
    });

    const body: ApiResponse = {
      success: true,
      data: { agent: await agentStore.getAgent(address) },
    };
    res.status(existing ? 200 : 201).json(body);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/a2a/executors
 * List registered A2A executors, optionally filtered by capability (ANY-match).
 *
 * Public — the executor set is not sensitive (you can see them all by polling
 * /a2a/tasks accepts anyway). Used by the frontend at task-creation time to
 * discover which pubkeys to ECIES-wrap the AES key to so each eligible
 * executor can decrypt the brief.
 *
 * Response shape is intentionally narrow: only fields the wrap step needs.
 */
a2aRouter.get('/executors', async (req, res, next) => {
  try {
    const caps = req.query.capabilities
      ? (req.query.capabilities as string).split(',').map((s) => s.trim()).filter(Boolean)
      : undefined;

    const executors = await agentStore.listAgents(caps);

    const body: ApiResponse = {
      success: true,
      data: {
        executors: executors
          // Only include executors that registered a pubkey — without one, the
          // poster has no way to wrap the AES key to them, so listing them
          // would silently include unreachable workers in the bundle.
          .filter((e) => !!e.publicKey)
          .map((e) => ({
            address: e.address,
            publicKey: e.publicKey,
            capabilities: e.capabilities,
            reputation: e.reputation,
          })),
      },
    };
    res.json(body);
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

    const tasks = await a2aStore.browseAgentTasks(caps, minRep);

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

    const meta = await a2aStore.getMeta(taskId);
    if (!meta) throw new AppError(404, 'NOT_FOUND', 'Task not found or not A2A-enabled');

    // Check agent is registered + capability match BEFORE the CAS, so we don't
    // burn the open→accepted transition on a caller who'd be 403'd anyway.
    const agent = await agentStore.getAgent(address);
    if (!agent) {
      throw new AppError(403, 'NOT_REGISTERED', 'Register as an agent executor first');
    }
    if (meta.requiredCapabilities.length > 0) {
      // Match the PostTask UI copy: "an executor agent matches if it has any one".
      // Tasks usually list multiple caps as hints, not strict requirements — a
      // worker with summarization can take a task tagged web_research+summarization
      // even if it doesn't claim web_research.
      const hasAny = meta.requiredCapabilities.some((c) => agent.capabilities.includes(c));
      if (!hasAny) {
        throw new AppError(
          403,
          'CAPABILITY_MISMATCH',
          `Need at least one of: ${meta.requiredCapabilities.join(', ')}`,
        );
      }
    }

    // Atomic open→accepted via a Lua CAS. Two concurrent /accept requests can
    // both pass an open-state read, so we serialise the transition itself on
    // the Redis server. Loser gets 409, no on-chain side effect — preserves
    // the invariant that the executor in Redis matches the one in the bridge
    // tx (and thereby the on-chain t.worker).
    const accept = await a2aStore.tryAccept(taskId, address, new Date().toISOString());
    if (!accept.ok) {
      throw new AppError(
        409,
        'NOT_OPEN',
        `Task is not open for acceptance (status: ${accept.currentStatus})`,
      );
    }

    // Fire-and-forget on-chain settlement: backend marketplace signer calls
    // marketplaceAssign(taskId, executor) so the contract knows who to pay.
    // We deliberately don't await — the HTTP response returns immediately
    // and the bridge logs its own progress. State update inside the bridge
    // persists the tx hash to a2aStore so clients can poll for confirmation.
    void settleAssignment(taskId, address);

    // Encrypted-brief slice: return the caller's wrappedKey + rootHash so the
    // worker can download from 0G Storage and AES-decrypt. The wrappedKey
    // lookup is by lowercased address; posters wrapped to lowercased keys at
    // task creation time. Both fields may be absent on legacy tasks created
    // before the encrypted-flow shipped — the worker treats that as "no brief
    // available, log and skip" rather than crashing.
    const wrappedKey = meta.wrappedKeys?.[address.toLowerCase()];
    const body: ApiResponse = {
      success: true,
      data: {
        taskId,
        status: 'accepted',
        rootHash: meta.rootHash,
        wrappedKey,
      },
    };
    res.json(body);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/a2a/tasks/:id/submit
 *
 * Records the executor's resultData and returns an unsigned submitEvidence
 * transaction. The executor signs and broadcasts it with their own wallet
 * (this is what the BlindEscrow contract enforces: submitEvidence is
 * `onlyWorker`). After confirmation, the executor calls /finalize so the
 * backend can run autoVerify (or wait for poster manual approval, depending
 * on verificationMode).
 *
 * Separation of submit and finalize is the only way to reconcile the
 * on-chain constraint (Assigned → Submitted only via a worker-signed call)
 * with the auto-verify bridge (which needs Submitted state before it can
 * fire completeVerification).
 */
a2aRouter.post('/tasks/:id/submit', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const taskHash = req.params.id as string;
    const address = req.user!.address;
    const { resultData } = submitSchema.parse(req.body);

    const meta = await a2aStore.getMeta(taskHash);
    if (!meta) throw new AppError(404, 'NOT_FOUND', 'Task not found or not A2A-enabled');

    const state = await a2aStore.getState(taskHash);
    if (!state || state.executorAddress?.toLowerCase() !== address.toLowerCase()) {
      throw new AppError(403, 'FORBIDDEN', 'Only the accepted executor can submit');
    }
    if (state.status !== 'accepted' && state.status !== 'in_progress') {
      throw new AppError(409, 'INVALID_STATE', `Cannot submit in state: ${state.status}`);
    }

    // Look up the on-chain taskId via the TaskCreated event mapping. Without
    // it we can't build the submitEvidence tx. The mapping is populated by
    // services/escrowEvents.ts within ~30s of createTask confirming on chain.
    const onChainId = await getTaskIdByHash(taskHash);
    if (!onChainId) {
      throw new AppError(
        503,
        'NOT_INDEXED',
        'On-chain taskId not yet indexed — wait a few seconds after task creation and retry',
      );
    }

    // Deterministic evidence hash = keccak256(JSON.stringify(resultData)).
    // The contract stores this bytes32 and it acts as the commitment for the
    // off-chain payload the verifier will evaluate.
    const evidenceHash = ethers.keccak256(
      ethers.toUtf8Bytes(JSON.stringify(resultData)),
    );

    const unsignedSubmitEvidence = await escrowService.buildSubmitEvidence(
      address,
      Number(onChainId),
      evidenceHash,
    );

    await a2aStore.updateState(taskHash, {
      status: 'submitted',
      resultData,
      submittedAt: new Date().toISOString(),
    });

    const body: ApiResponse = {
      success: true,
      data: {
        taskId: taskHash,
        onChainTaskId: onChainId,
        status: 'submitted',
        evidenceHash,
        unsignedSubmitEvidence,
      },
    };
    res.json(body);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/a2a/tasks/:id/finalize
 *
 * Called by the executor after their submitEvidence tx confirms on chain.
 * For verificationMode=auto: runs autoVerify and fires settleVerification.
 * For verificationMode=manual: returns immediately, leaving state='submitted'
 * for the poster to approve via the /verify endpoint.
 *
 * This split exists because completeVerification (called by settleVerification)
 * requires on-chain status=Submitted, which only happens after the executor
 * personally signs submitEvidence. Finalize is the "OK I've signed it, please
 * proceed with verification" signal.
 */
a2aRouter.post('/tasks/:id/finalize', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const taskHash = req.params.id as string;
    const address = req.user!.address;

    const meta = await a2aStore.getMeta(taskHash);
    if (!meta) throw new AppError(404, 'NOT_FOUND', 'Task not found or not A2A-enabled');

    const state = await a2aStore.getState(taskHash);
    if (!state || state.executorAddress?.toLowerCase() !== address.toLowerCase()) {
      throw new AppError(403, 'FORBIDDEN', 'Only the recorded executor can finalize');
    }
    if (state.status !== 'submitted') {
      throw new AppError(409, 'INVALID_STATE', `Cannot finalize in state: ${state.status}`);
    }
    if (!state.resultData) {
      throw new AppError(400, 'NO_RESULT_DATA', 'No resultData recorded for this task');
    }

    // Manual mode: leave state='submitted' and let the poster decide via
    // the /verify endpoint. No on-chain action from the bridge here.
    if (meta.verificationMode !== 'auto' || !meta.verificationCriteria) {
      const body: ApiResponse = {
        success: true,
        data: { taskId: taskHash, status: 'submitted', awaitingPosterApproval: true },
      };
      res.json(body);
      return;
    }

    // Auto mode: run criteria check now that we know submitEvidence is on chain.
    const verificationResult = autoVerify(state.resultData, meta.verificationCriteria);
    const newStatus: 'verified' | 'failed' = verificationResult.passed ? 'verified' : 'failed';

    await a2aStore.updateState(taskHash, {
      status: newStatus,
      verificationResult,
    });

    if (verificationResult.passed) {
      const agent = await agentStore.getAgent(address);
      if (agent) {
        agent.tasksCompleted += 1;
        agent.reputation = Math.min(100, agent.reputation + 1);
        await agentStore.registerAgent(agent);
      }
    }

    // Fire-and-forget bridge call: marketplace signer calls completeVerification
    // on chain. Since submitEvidence already confirmed (executor wouldn't have
    // called /finalize otherwise), the contract status is now Submitted — the
    // bridge call should succeed.
    void settleVerification(taskHash, verificationResult.passed);

    const body: ApiResponse = {
      success: true,
      data: { taskId: taskHash, status: newStatus, verificationResult },
    };
    res.json(body);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/a2a/tasks/:id/verify
 *
 * Poster-only manual approval. Records the verdict in a2aStore and fires the
 * settlement bridge so the marketplace signer can call completeVerification
 * on chain. Only valid for verificationMode=manual tasks in state=submitted.
 *
 * Authorization: req.user.address must match the task's recorded poster
 * (meta.posterAddress, captured at task creation). We deliberately don't fall
 * back to reading t.agent from the on-chain task — meta.posterAddress is the
 * authenticated address that called POST /tasks, which is the right answer
 * even if for some reason on-chain and off-chain identities diverge.
 */
a2aRouter.post('/tasks/:id/verify', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const taskHash = req.params.id as string;
    const address = req.user!.address;
    const { passed, reasons } = verifySchema.parse(req.body);

    const meta = await a2aStore.getMeta(taskHash);
    if (!meta) throw new AppError(404, 'NOT_FOUND', 'Task not found or not A2A-enabled');

    if (!meta.posterAddress || meta.posterAddress.toLowerCase() !== address.toLowerCase()) {
      throw new AppError(403, 'NOT_POSTER', 'Only the task poster can manually verify');
    }
    if (meta.verificationMode !== 'manual') {
      throw new AppError(409, 'WRONG_MODE', 'Task is not in manual-verify mode');
    }

    const state = await a2aStore.getState(taskHash);
    if (!state || state.status !== 'submitted') {
      throw new AppError(409, 'INVALID_STATE', `Cannot verify in state: ${state?.status ?? 'missing'}`);
    }

    const verificationResult = { passed, reasons: reasons ?? [] };
    const newStatus: 'verified' | 'failed' = passed ? 'verified' : 'failed';

    await a2aStore.updateState(taskHash, {
      status: newStatus,
      verificationResult,
    });

    if (passed && state.executorAddress) {
      const agent = await agentStore.getAgent(state.executorAddress);
      if (agent) {
        agent.tasksCompleted += 1;
        agent.reputation = Math.min(100, agent.reputation + 1);
        await agentStore.registerAgent(agent);
      }
    }

    // Bridge: marketplace signer calls completeVerification on chain. Assumes
    // submitEvidence already confirmed (the executor called /finalize earlier,
    // which only succeeds if state=submitted, which only happens after they
    // sign submitEvidence — manual mode just deferred verification, not the
    // on-chain submission).
    void settleVerification(taskHash, passed);

    const body: ApiResponse = {
      success: true,
      data: { taskId: taskHash, status: newStatus, verificationResult },
    };
    res.json(body);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/a2a/tasks/posted
 * Returns all A2A tasks posted by the authenticated address. Drives the
 * poster's /a2a → to_review inbox (client-side filters for state==submitted
 * and verificationMode==manual).
 */
a2aRouter.get('/tasks/posted', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const address = req.user!.address;
    const tasks = await a2aStore.getPosterTasks(address);

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
 * GET /api/v1/a2a/executions
 * List my accepted/completed tasks.
 */
a2aRouter.get('/executions', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const address = req.user!.address;
    const tasks = await a2aStore.getExecutorTasks(address);

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
    const agent = await agentStore.getAgent(address);

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
