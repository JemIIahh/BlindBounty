import { Router } from 'express';
import { ethers } from 'ethers';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { config } from '../config.js';
import { AppError } from '../middleware/errorHandler.js';
import type { ApiResponse } from '../types.js';

export const authRouter = Router();

// In-memory nonce store: address → { nonce, expiresAt }
const nonceStore = new Map<string, { nonce: string; expiresAt: number }>();
const NONCE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const MAX_NONCE_STORE_SIZE = 10_000;

// Periodic sweep of expired nonces to prevent unbounded memory growth
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of nonceStore) {
    if (now > entry.expiresAt) nonceStore.delete(key);
  }
}, 60_000); // sweep every minute

// --- Schemas ---
const nonceSchema = z.object({
  address: z.string().regex(/^0x[0-9a-fA-F]{40}$/, 'Invalid Ethereum address'),
});

const verifySchema = z.object({
  address: z.string().regex(/^0x[0-9a-fA-F]{40}$/, 'Invalid Ethereum address'),
  signature: z.string().min(1, 'Signature is required'),
});

/**
 * POST /api/v1/auth/nonce
 * Generate a random nonce for the given wallet address.
 */
authRouter.post('/nonce', (req, res, next) => {
  try {
    const { address } = nonceSchema.parse(req.body);
    const normalized = address.toLowerCase();

    // Cap store size to prevent memory exhaustion from nonce spam
    if (nonceStore.size >= MAX_NONCE_STORE_SIZE) {
      throw new AppError(429, 'TOO_MANY_REQUESTS', 'Too many pending nonces, try again later');
    }

    const nonce = ethers.hexlify(ethers.randomBytes(32));
    nonceStore.set(normalized, { nonce, expiresAt: Date.now() + NONCE_TTL_MS });

    const body: ApiResponse<{ nonce: string }> = {
      success: true,
      data: { nonce },
    };
    res.json(body);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/auth/verify
 * Verify a signed nonce (EIP-191 personal_sign) and issue a JWT.
 */
authRouter.post('/verify', (req, res, next) => {
  try {
    const { address, signature } = verifySchema.parse(req.body);
    const normalized = address.toLowerCase();

    const entry = nonceStore.get(normalized);
    if (!entry) {
      throw new AppError(400, 'NONCE_NOT_FOUND', 'Request a nonce first');
    }

    if (Date.now() > entry.expiresAt) {
      nonceStore.delete(normalized);
      throw new AppError(400, 'NONCE_EXPIRED', 'Nonce expired, request a new one');
    }

    // Build the message the user signed
    const message = `Sign this message to authenticate with BlindBounty.\n\nNonce: ${entry.nonce}`;

    // Recover signer
    const recovered = ethers.verifyMessage(message, signature).toLowerCase();
    if (recovered !== normalized) {
      throw new AppError(401, 'INVALID_SIGNATURE', 'Signature does not match address');
    }

    // Consume nonce
    nonceStore.delete(normalized);

    // Issue JWT — pin algorithm to HS256 to prevent algorithm confusion attacks
    const token = jwt.sign({ address: normalized }, config.jwtSecret, {
      algorithm: 'HS256',
      expiresIn: config.jwtExpiry as string,
    } as jwt.SignOptions);

    const body: ApiResponse<{ token: string; expiresIn: string }> = {
      success: true,
      data: { token, expiresIn: config.jwtExpiry },
    };
    res.json(body);
  } catch (err) {
    next(err);
  }
});
