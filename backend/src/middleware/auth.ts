import type { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { timingSafeEqual } from 'crypto';
import { config } from '../config.js';
import { AppError } from './errorHandler.js';
import type { AuthRequest, AuthUser } from '../types.js';

/** Constant-time string comparison to prevent timing attacks on API keys */
function safeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

/** Check if a string is the configured agent API key (timing-safe) */
function isAgentApiKey(candidate: string): boolean {
  return !!(config.agentApiKey && safeCompare(candidate, config.agentApiKey));
}

/**
 * Auth middleware: accepts JWT Bearer token or X-API-Key.
 * Attaches `req.user = { address }` on success.
 */
export function requireAuth(req: AuthRequest, _res: Response, next: NextFunction): void {
  // 1. Check X-API-Key header (for agent operations)
  const apiKey = req.headers['x-api-key'] as string | undefined;
  if (apiKey && isAgentApiKey(apiKey)) {
    req.user = { address: 'agent' };
    next();
    return;
  }

  // 2. Check Authorization: Bearer <JWT or API key>
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
  }

  const token = authHeader.slice(7);

  // Check if it's the API key passed as Bearer
  if (isAgentApiKey(token)) {
    req.user = { address: 'agent' };
    next();
    return;
  }

  try {
    const payload = jwt.verify(token, config.jwtSecret, { algorithms: ['HS256'] });
    // Validate payload shape — jwt.verify returns string | JwtPayload
    if (typeof payload === 'string' || !payload || typeof (payload as any).address !== 'string') {
      throw new Error('malformed payload');
    }
    req.user = { address: (payload as any).address };
    next();
  } catch {
    throw new AppError(401, 'INVALID_TOKEN', 'Invalid or expired token');
  }
}

/**
 * Optional auth — attaches user if token present, continues regardless.
 */
export function optionalAuth(req: AuthRequest, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    next();
    return;
  }

  const token = authHeader.slice(7);

  // API key check
  const apiKey = req.headers['x-api-key'] as string | undefined;
  if ((apiKey && isAgentApiKey(apiKey)) || isAgentApiKey(token)) {
    req.user = { address: 'agent' };
    next();
    return;
  }

  try {
    const payload = jwt.verify(token, config.jwtSecret, { algorithms: ['HS256'] });
    if (typeof payload !== 'string' && payload && typeof (payload as any).address === 'string') {
      req.user = { address: (payload as any).address };
    }
  } catch {
    // Ignore invalid tokens for optional auth
  }
  next();
}
