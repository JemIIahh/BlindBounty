import { BlindBountyError, type ErrorOptions } from './BlindBountyError.js';
import type {
  ApiCode,
  ChainCode,
  ComputeCode,
  ConfigCode,
  CryptoCode,
  LifecycleCode,
  StorageCode,
  TimeoutCode,
} from './codes.js';

export class ConfigError extends BlindBountyError {
  constructor(code: ConfigCode, msg: string, opts?: ErrorOptions) {
    super(code, msg, opts);
  }
}

export class CryptoError extends BlindBountyError {
  constructor(code: CryptoCode, msg: string, opts?: ErrorOptions) {
    super(code, msg, opts);
  }
}

export class StorageError extends BlindBountyError {
  constructor(code: StorageCode, msg: string, opts?: ErrorOptions) {
    super(code, msg, opts);
  }
}

export class ChainError extends BlindBountyError {
  constructor(code: ChainCode, msg: string, opts?: ErrorOptions) {
    super(code, msg, opts);
  }
}

export class ComputeError extends BlindBountyError {
  constructor(code: ComputeCode, msg: string, opts?: ErrorOptions) {
    super(code, msg, opts);
  }
}

export class ApiError extends BlindBountyError {
  constructor(code: ApiCode, msg: string, opts?: ErrorOptions) {
    super(code, msg, opts);
  }
}

export class LifecycleError extends BlindBountyError {
  constructor(code: LifecycleCode, msg: string, opts?: ErrorOptions) {
    super(code, msg, opts);
  }
}

export class TimeoutError extends BlindBountyError {
  constructor(code: TimeoutCode, msg: string, opts?: ErrorOptions) {
    super(code, msg, opts);
  }
}
