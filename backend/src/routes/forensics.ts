import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth.js';
import type { AuthRequest } from '../types.js';
import { forensicStore } from '../services/forensicStore.js';
import { validateForensicReport } from '../services/forensicValidation.js';

const router = Router();

const submitSchema = z.object({
  taskId: z.string().min(1),
  signedReport: z.object({
    report: z.object({
      version: z.literal(1),
      taskId: z.string(),
      workerAddress: z.string(),
      timestamp: z.number(),
      exif: z.object({
        make: z.string().optional(),
        model: z.string().optional(),
        dateTime: z.string().optional(),
        dateTimeOriginal: z.string().optional(),
        gpsLat: z.number().optional(),
        gpsLng: z.number().optional(),
        software: z.string().optional(),
        imageWidth: z.number().optional(),
        imageHeight: z.number().optional(),
      }),
      photoSource: z.enum(['camera', 'gallery', 'screenshot', 'edited', 'unknown']),
      phash: z.string().length(16),
      deviceFingerprint: z.object({
        screenWidth: z.number(),
        screenHeight: z.number(),
        hardwareConcurrency: z.number(),
        deviceMemory: z.number().nullable(),
        webglRenderer: z.string(),
        userAgent: z.string(),
        platform: z.string(),
      }),
      freshness: z.object({
        photoAgeMs: z.number().nullable(),
        submissionTimestamp: z.number(),
        isFresh: z.boolean(),
        maxAgeMs: z.number(),
      }),
      tamperingSignals: z.array(z.string()),
      reportHash: z.string(),
    }),
    signature: z.string(),
  }),
});

// POST /api/v1/forensics/submit
router.post('/submit', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const parsed = submitSchema.parse(req.body);
    const { taskId, signedReport } = parsed;

    const validation = await validateForensicReport(signedReport);
    forensicStore.saveReport(taskId, signedReport, validation);

    res.json({ success: true, data: validation });
  } catch (err: any) {
    if (err?.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: err.errors?.[0]?.message || 'Invalid input' },
      });
    }
    next(err);
  }
});

// GET /api/v1/forensics/:taskId
router.get('/:taskId', requireAuth, async (req: AuthRequest, res, next) => {
  try {
    const taskId = req.params.taskId as string;
    const data = forensicStore.getReport(taskId);
    if (!data) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'No forensic report for this task' },
      });
    }
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

export { router as forensicsRouter };
