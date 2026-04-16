import { Router } from 'express';
import { z } from 'zod';
import { AppError } from '../middleware/errorHandler.js';
import * as reputationService from '../services/reputation.js';
import type { ApiResponse } from '../types.js';

export const reputationRouter = Router();

const addressSchema = z.string().regex(/^0x[0-9a-fA-F]{40}$/, 'Invalid Ethereum address');

/**
 * GET /api/v1/reputation/leaderboard
 * Top workers by score (limited on-chain scan, cached).
 * NOTE: On-chain contracts don't support enumeration of all workers.
 * This is a stub that returns an empty list until an indexer is added.
 */
reputationRouter.get('/leaderboard', async (_req, res, next) => {
  try {
    // TODO: Wire to an indexer or event-based cache in Phase 6
    const body: ApiResponse = {
      success: true,
      data: {
        leaderboard: [],
        note: 'Leaderboard requires an event indexer. Coming in Phase 6.',
      },
    };
    res.json(body);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/reputation/:address
 * Get anonymous reputation score for a worker.
 */
reputationRouter.get('/:address', async (req, res, next) => {
  try {
    const address = addressSchema.parse(req.params.address);
    const rep = await reputationService.getReputation(address);

    const tasksCompleted = Number(rep.tasksCompleted);
    const totalScore = Number(rep.totalScore);
    const disputes = Number(rep.disputes);
    const avgScore = tasksCompleted > 0 ? totalScore / tasksCompleted : 0;

    const body: ApiResponse = {
      success: true,
      data: {
        address,
        tasksCompleted,
        avgScore: Math.round(avgScore * 100) / 100,
        disputes,
      },
    };
    res.json(body);
  } catch (err) {
    next(err);
  }
});
