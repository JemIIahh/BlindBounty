import { ConfigError } from '../errors/index.js';
import { networks, type NetworkName } from './presets.js';
import type { Network } from './types.js';

/**
 * Resolve a preset name or a literal Network object into the canonical
 * Network used throughout the SDK. Throws ConfigError for unknown names.
 */
export function resolveNetwork(arg: NetworkName | Network): Network {
  if (typeof arg === 'string') {
    const preset = (networks as Record<string, Network | undefined>)[arg];
    if (!preset) {
      const known = Object.keys(networks).join(', ');
      throw new ConfigError('CONFIG/INVALID_NETWORK', `unknown network '${arg}' (known: ${known})`);
    }
    return preset;
  }
  return arg;
}
