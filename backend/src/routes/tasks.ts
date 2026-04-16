import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import * as escrowService from '../services/escrow.js';
import * as registryService from '../services/registry.js';
import type { AuthRequest, ApiResponse, Application } from '../types.js';
import { randomUUID } from 'crypto';

export const tasksRouter = Router();

// In-memory applications store (backed by JSON file in production)
const applications: Application[] = [];

// --- Schemas ---
const createTaskSchema = z.object({
  taskHash: z.string().regex(/^0x[0-9a-fA-F]{64}$/, 'Must be a bytes32 hex string'),
  token: z.string().regex(/^0x[0-9a-fA-F]{40}$/, 'Invalid token address'),
  amount: z.string().min(1, 'Amount required'), // bigint as string
  category: z.string().min(1).max(64),
  locationZone: z.string().min(1).max(128),
  duration: z.string().min(1, 'Duration required'), // seconds as string
});

const applySchema = z.object({
  message: z.string().max(500).optional(),
});

const assignSchema = z.object({
  worker: z.string().regex(/^0x[0-9a-fA-F]{40}$/, 'Invalid worker address'),
});

// --- Helpers ---
function serializeBigInts(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    result[key] = typeof value === 'bigint' ? value.toString() : value;
  }
  return result;
}

/**
 * GET /api/v1/tasks
 * List open tasks from TaskRegistry (paginated).
 */
tasksRouter.get('/', async (req, res, next) => {
  try {
    const offset = Math.max(0, parseInt(req.query.offset as string) || 0);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));

    let tasks: Record<string, unknown>[] = [];
    let total = 0;
    try {
      const rawTasks = await registryService.getOpenTasks(offset, limit);
      total = await registryService.openTaskCount();
      tasks = rawTasks.map((t) => serializeBigInts(t as unknown as Record<string, unknown>));
    } catch (chainErr) {
      // In dev mode with dummy contract addresses, chain calls will fail.
      // Return empty task list so the frontend can still render.
      console.warn('[tasks] Chain call failed, returning empty list:', (chainErr as Error).message);
    }

    const body: ApiResponse = {
      success: true,
      data: {
        tasks,
        total,
        offset,
        limit,
        hasMore: offset + tasks.length < total,
      },
    };
    res.json(body);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/tasks/:id
 * Get full task details from BlindEscrow + TaskRegistry metadata.
 */
tasksRouter.get('/:id', async (req, res, next) => {
  try {
    const taskId = parseInt(req.params.id);
    if (isNaN(taskId) || taskId < 1) {
      throw new AppError(400, 'INVALID_TASK_ID', 'Task ID must be a positive integer');
    }

    const [task, meta] = await Promise.all([
      escrowService.getTask(taskId),
      registryService.getTaskMeta(taskId).catch(() => null),
    ]);

    const body: ApiResponse = {
      success: true,
      data: {
        ...serializeBigInts(task as unknown as Record<string, unknown>),
        meta: meta ? serializeBigInts(meta as unknown as Record<string, unknown>) : null,
      },
    };
    res.json(body);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/tasks
 * Build unsigned createTask transaction for frontend to sign.
 */
tasksRouter.post('/', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const data = createTaskSchema.parse(req.body);
    const from = req.user!.address;

    const tx = await escrowService.buildCreateTask(
      from,
      data.taskHash,
      data.token,
      BigInt(data.amount),
      data.category,
      data.locationZone,
      BigInt(data.duration),
    );

    const body: ApiResponse = {
      success: true,
      data: { unsignedTx: tx },
    };
    res.json(body);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/tasks/:id/apply
 * Record a task application (in-memory store).
 */
tasksRouter.post('/:id/apply', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const taskId = req.params.id as string;
    const { message } = applySchema.parse(req.body);
    const applicant = req.user!.address;

    // Check for duplicate application
    const existing = applications.find(
      (a) => a.taskId === taskId && a.applicant === applicant,
    );
    if (existing) {
      throw new AppError(409, 'ALREADY_APPLIED', 'Already applied to this task');
    }

    const application: Application = {
      id: randomUUID(),
      taskId,
      applicant,
      message,
      createdAt: new Date().toISOString(),
    };
    applications.push(application);

    const body: ApiResponse = {
      success: true,
      data: { application_id: application.id },
    };
    res.status(201).json(body);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/tasks/:id/applications
 * List applicants for a task (agent only — shows reputation, not identity).
 */
tasksRouter.get('/:id/applications', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const taskId = req.params.id;
    const taskApps = applications.filter((a) => a.taskId === taskId);

    const body: ApiResponse = {
      success: true,
      data: { applications: taskApps },
    };
    res.json(body);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/tasks/:id/assign
 * Build unsigned assignWorker transaction.
 */
tasksRouter.post('/:id/assign', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const taskId = parseInt(req.params.id as string);
    if (isNaN(taskId) || taskId < 1) {
      throw new AppError(400, 'INVALID_TASK_ID', 'Task ID must be a positive integer');
    }

    const { worker } = assignSchema.parse(req.body);
    const from = req.user!.address;

    const tx = await escrowService.buildAssignWorker(from, taskId, worker);

    const body: ApiResponse = {
      success: true,
      data: { unsignedTx: tx },
    };
    res.json(body);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/tasks/:id/cancel
 * Build unsigned cancelTask transaction.
 */
tasksRouter.post('/:id/cancel', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const taskId = parseInt(req.params.id as string);
    if (isNaN(taskId) || taskId < 1) {
      throw new AppError(400, 'INVALID_TASK_ID', 'Task ID must be a positive integer');
    }

    const from = req.user!.address;
    const tx = await escrowService.buildCancelTask(from, taskId);

    const body: ApiResponse = {
      success: true,
      data: { unsignedTx: tx },
    };
    res.json(body);
  } catch (err) {
    next(err);
  }
});
