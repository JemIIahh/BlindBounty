import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth.js';
import { AppError } from '../middleware/errorHandler.js';
import * as escrowService from '../services/escrow.js';
import type { AuthRequest, ApiResponse } from '../types.js';

export const submissionsRouter = Router();

// --- Schemas ---
const submitSchema = z.object({
  taskId: z.number().int().positive(),
  evidenceHash: z.string().regex(/^0x[0-9a-fA-F]{64}$/, 'Must be a bytes32 hex string'),
});

const approveSchema = z.object({
  taskId: z.number().int().positive(),
  passed: z.boolean(),
});

/**
 * POST /api/v1/submissions/submit
 * Build unsigned submitEvidence transaction for worker to sign.
 */
submissionsRouter.post('/submit', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const { taskId, evidenceHash } = submitSchema.parse(req.body);
    const from = req.user!.address;

    const tx = await escrowService.buildSubmitEvidence(from, taskId, evidenceHash);

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
 * POST /api/v1/submissions/verify
 * Build unsigned completeVerification transaction (verifier/agent auth).
 */
submissionsRouter.post('/verify', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const { taskId, passed } = approveSchema.parse(req.body);
    const from = req.user!.address;

    const tx = await escrowService.buildCompleteVerification(from, taskId, passed);

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
 * GET /api/v1/submissions/:taskId
 * Get evidence hash from on-chain task.
 */
submissionsRouter.get('/:taskId', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const taskId = parseInt(req.params.taskId as string);
    if (isNaN(taskId) || taskId < 1) {
      throw new AppError(400, 'INVALID_TASK_ID', 'Task ID must be a positive integer');
    }

    const task = await escrowService.getTask(taskId);

    const body: ApiResponse = {
      success: true,
      data: {
        taskId,
        evidenceHash: task.evidenceHash,
        status: task.status,
        submissionAttempts: task.submissionAttempts,
      },
    };
    res.json(body);
  } catch (err) {
    next(err);
  }
});
