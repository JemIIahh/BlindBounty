import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import type { AuthRequest } from '../types.js';
import * as accountingService from '../services/accountingService.js';

export const accountingRouter = Router();

// GET /api/v1/accounting/entries
accountingRouter.get('/entries', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const address = req.user!.address;
    const from = req.query.from as string | undefined;
    const to = req.query.to as string | undefined;
    const type = req.query.type as string | undefined;

    const result = accountingService.getTransactions(address, from, to, type);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/accounting/summary
accountingRouter.get('/summary', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const address = req.user!.address;
    const from = req.query.from as string | undefined;
    const to = req.query.to as string | undefined;

    const summary = accountingService.getSummary(address, from, to);
    res.json({ success: true, data: summary });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/accounting/export
accountingRouter.get('/export', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const address = req.user!.address;
    const from = req.query.from as string | undefined;
    const to = req.query.to as string | undefined;
    const format = (req.query.format as string) || 'json';

    if (format === 'csv') {
      const csv = accountingService.exportCsv(address, from, to);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=transactions.csv');
      return res.send(csv);
    }

    const result = accountingService.getTransactions(address, from, to);
    res.setHeader('Content-Disposition', 'attachment; filename=transactions.json');
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});
