import { Router } from 'express';
import type { ApiResponse } from '../types.js';

export const healthRouter = Router();

healthRouter.get('/', (_req, res) => {
  const body: ApiResponse<{ status: string; timestamp: string }> = {
    success: true,
    data: { status: 'ok', timestamp: new Date().toISOString() },
  };
  res.json(body);
});
