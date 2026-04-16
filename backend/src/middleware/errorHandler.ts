import type { Request, Response, NextFunction } from 'express';
import type { ApiErrorResponse } from '../types.js';

/** Custom error with HTTP status and error code */
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

/** Global error handler — never leaks stack traces in production */
export function globalErrorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    const body: ApiErrorResponse = {
      success: false,
      error: { code: err.code, message: err.message },
    };
    res.status(err.statusCode).json(body);
    return;
  }

  // Zod validation errors
  if (err.name === 'ZodError') {
    const body: ApiErrorResponse = {
      success: false,
      error: { code: 'VALIDATION_ERROR', message: err.message },
    };
    res.status(400).json(body);
    return;
  }

  console.error('[unhandled]', err);

  const body: ApiErrorResponse = {
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message:
        process.env.NODE_ENV === 'production'
          ? 'Internal server error'
          : err.message,
    },
  };
  res.status(500).json(body);
}
