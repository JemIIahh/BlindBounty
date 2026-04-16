import rateLimit from 'express-rate-limit';

/** 100 requests per minute per IP */
export function createRateLimiter() {
  return rateLimit({
    windowMs: 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      error: { code: 'RATE_LIMIT', message: 'Too many requests, please try again later' },
    },
  });
}
