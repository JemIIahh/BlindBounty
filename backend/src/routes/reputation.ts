import { Router } from 'express';
import { AppError } from '../middleware/errorHandler.js';
import * as reputationService from '../services/reputation.js';
import * as reputationDecay from '../services/reputationDecay.js';
import type { ApiResponse } from '../types.js';

export const reputationRouter = Router();

const addressSchema = /^0x[0-9a-fA-F]{40}$/;

/**
 * GET /api/v1/reputation/leaderboard
 * Top workers by decayed score (Neon PostgreSQL).
 */
reputationRouter.get('/leaderboard', async (req, res, next) => {
  try {
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
    const leaderboard = await reputationDecay.getLeaderboard(limit);

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
 * Merged reputation: on-chain BlindReputation + off-chain decayed score.
 */
reputationRouter.get('/:address', async (req, res, next) => {
  try {
    const address = req.params.address;
    if (!addressSchema.test(address)) {
      throw new AppError(400, 'BAD_ADDRESS', 'Invalid Ethereum address');
    }

    const [onChain, decayed] = await Promise.all([
      reputationService.getReputationWithScore(address).catch(() => null),
      reputationDecay.getDecayedReputation(address),
    ]);

    const body: ApiResponse = {
      success: true,
      data: {
        address,
        tasksCompleted: onChain?.tasksCompleted ?? decayed.tasksCompleted,
        avgScore: onChain?.avgScore ?? 0,
        disputes: onChain?.disputes ?? decayed.disputes,
        disputeRatio: onChain?.disputeRatio ?? 0,
        onChainScore: onChain?.score ?? 0,
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
 * Reputation event timeline (Neon PostgreSQL).
 */
reputationRouter.get('/:address/history', async (req, res, next) => {
  try {
    const address = req.params.address;
    if (!addressSchema.test(address)) {
      throw new AppError(400, 'BAD_ADDRESS', 'Invalid Ethereum address');
    }

    const history = await reputationDecay.getReputationHistory(address);
    res.json({ success: true, data: { history } });
  } catch (err) {
    next(err);
  }
});
