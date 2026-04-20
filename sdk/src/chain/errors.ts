import { ChainError } from '../errors/index.js';

interface EthersLikeError {
  code?: string;
  shortMessage?: string;
  message?: string;
  reason?: string;
  data?: unknown;
  info?: unknown;
}

/**
 * Map an ethers-thrown error to a typed ChainError. Best-effort: walks the
 * ethers error shape for a revert reason, maps common codes (INSUFFICIENT_FUNDS,
 * NETWORK_ERROR, TIMEOUT), and falls back to TX_REVERTED with the original
 * message in context.
 */
export function wrapChainError(err: unknown, hint?: string): ChainError {
  const e = (err ?? {}) as EthersLikeError;
  const msg = e.shortMessage ?? e.reason ?? e.message ?? 'unknown chain error';
  const withHint = hint ? `${hint}: ${msg}` : msg;

  switch (e.code) {
    case 'INSUFFICIENT_FUNDS':
      return new ChainError('CHAIN/INSUFFICIENT_BALANCE', withHint, { cause: err, retriable: false });
    case 'NONCE_EXPIRED':
    case 'REPLACEMENT_UNDERPRICED':
      return new ChainError('CHAIN/NONCE_CONFLICT', withHint, { cause: err, retriable: true });
    case 'NETWORK_ERROR':
    case 'SERVER_ERROR':
    case 'TIMEOUT':
      return new ChainError('CHAIN/TX_TIMED_OUT', withHint, { cause: err, retriable: true });
    case 'UNSUPPORTED_OPERATION':
    case 'UNKNOWN_ERROR':
    case 'CALL_EXCEPTION':
      return new ChainError('CHAIN/TX_REVERTED', withHint, {
        cause: err,
        ...(e.data !== undefined ? { context: { data: e.data } } : {}),
      });
    default:
      return new ChainError('CHAIN/TX_REVERTED', withHint, { cause: err });
  }
}
