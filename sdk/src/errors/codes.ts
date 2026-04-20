export const ErrorCodes = {
  Config: ['CONFIG/INVALID_NETWORK', 'CONFIG/MISSING_SIGNER', 'CONFIG/BAD_CONFIG'] as const,
  Crypto: [
    'CRYPTO/INVALID_KEY',
    'CRYPTO/DECRYPT_FAILED',
    'CRYPTO/INTEGRITY_CHECK',
    'CRYPTO/UNSUPPORTED_CIPHER',
  ] as const,
  Storage: [
    'STORAGE/UPLOAD_FAILED',
    'STORAGE/DOWNLOAD_FAILED',
    'STORAGE/MERKLE_MISMATCH',
    'STORAGE/NOT_FOUND',
    'STORAGE/INDEXER_UNREACHABLE',
  ] as const,
  Chain: [
    'CHAIN/TX_REVERTED',
    'CHAIN/TX_TIMED_OUT',
    'CHAIN/NONCE_CONFLICT',
    'CHAIN/INSUFFICIENT_BALANCE',
    'CHAIN/NETWORK_MISMATCH',
    'CHAIN/CONTRACT_NOT_DEPLOYED',
  ] as const,
  Compute: [
    'COMPUTE/BROKER_UNREACHABLE',
    'COMPUTE/NO_PROVIDERS',
    'COMPUTE/LEDGER_INSUFFICIENT',
    'COMPUTE/TEE_ATTESTATION_INVALID',
    'COMPUTE/VERIFICATION_TIMEOUT',
  ] as const,
  Api: [
    'API/AUTH_REQUIRED',
    'API/AUTH_EXPIRED',
    'API/FORBIDDEN',
    'API/RATE_LIMITED',
    'API/VALIDATION',
    'API/SERVER',
    'API/NOT_FOUND',
  ] as const,
  Lifecycle: [
    'LIFECYCLE/ILLEGAL_TRANSITION',
    'LIFECYCLE/TASK_NOT_FOUND',
    'LIFECYCLE/NOT_ASSIGNED',
    'LIFECYCLE/ALREADY_SUBMITTED',
    'LIFECYCLE/CLAIM_NOT_READY',
  ] as const,
  Timeout: ['TIMEOUT'] as const,
} as const;

export type ConfigCode = (typeof ErrorCodes.Config)[number];
export type CryptoCode = (typeof ErrorCodes.Crypto)[number];
export type StorageCode = (typeof ErrorCodes.Storage)[number];
export type ChainCode = (typeof ErrorCodes.Chain)[number];
export type ComputeCode = (typeof ErrorCodes.Compute)[number];
export type ApiCode = (typeof ErrorCodes.Api)[number];
export type LifecycleCode = (typeof ErrorCodes.Lifecycle)[number];
export type TimeoutCode = (typeof ErrorCodes.Timeout)[number];

export type ErrorCode =
  | ConfigCode
  | CryptoCode
  | StorageCode
  | ChainCode
  | ComputeCode
  | ApiCode
  | LifecycleCode
  | TimeoutCode;
