import { Router } from 'express';
import { z } from 'zod';
import { AppError } from '../middleware/errorHandler.js';
import * as reputationService from '../services/reputation.js';
import * as reputationDecay from '../services/reputationDecay.js';
import type { ApiResponse } from '../types.js';

export const reputationRouter = Router();

const addressSchema = z.string().regex(/^0x[0-9a-fA-F]{40}$/, 'Invalid Ethereum address');

/**
 * GET /api/v1/reputation/leaderboard
 * Top workers by decayed score.
 */
reputationRouter.get('/leaderboard', async (req, res, next) => {
  try {
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
    const leaderboard = reputationDecay.getLeaderboard(limit);

    const body: ApiResponse = {
      success: true,
      data: { leaderboard },
    };
    res.json(body);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/reputation/:address
 * Get anonymous reputation score for a worker, merged with decay data.
 */
reputationRouter.get('/:address', async (req, res, next) => {
  try {
    const address = addressSchema.parse(req.params.address);

    // On-chain reputation
    let onChain = { tasksCompleted: 0, avgScore: 0, disputes: 0 };
    try {
      const rep = await reputationService.getReputation(address);
      const tasksCompleted = Number(rep.tasksCompleted);
      const totalScore = Number(rep.totalScore);
      const disputes = Number(rep.disputes);
      const avgScore = tasksCompleted > 0 ? totalScore / tasksCompleted : 0;
      onChain = {
        tasksCompleted,
        avgScore: Math.round(avgScore * 100) / 100,
        disputes,
      };
    } catch {
      // On-chain call may fail in dev mode
    }

    // Off-chain decayed reputation from SQLite
    const decayed = reputationDecay.getDecayedReputation(address);

    const body: ApiResponse = {
      success: true,
      data: {
        address,
        ...onChain,
        rawScore: decayed.rawScore,
        decayedScore: decayed.decayedScore,
        decayFactor: decayed.decayFactor,
        daysSinceLastTask: decayed.daysSinceLastTask,
        offChainTasksCompleted: decayed.tasksCompleted,
        offChainDisputes: decayed.disputes,
      },
    };
    res.json(body);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/reputation/:address/history
 * Reputation event timeline.
 */
reputationRouter.get('/:address/history', async (req, res, next) => {
  try {
    const address = addressSchema.parse(req.params.address);
    const history = reputationDecay.getReputationHistory(address);
    res.json({ success: true, data: { history } });
  } catch (err) {
    next(err);
  }
});
