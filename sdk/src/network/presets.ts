import type { Network } from './types.js';

/**
 * Known-good network presets. Addresses pinned per SDK version so upgrading
 * the SDK cannot silently move contracts under a consumer.
 *
 * testnet = 0G Galileo (chainId 16602) — addresses from
 * contracts/deployments/0g-testnet.json (deployed 2026-04-15).
 */
export const networks = {
  testnet: {
    name: '0g-galileo-testnet',
    chainId: 16602n,
    rpc: ['https://evmrpc-testnet.0g.ai'],
    contracts: {
      escrow: '0xFd4F93F5A7BE144c405D1D8fbEC63Fb776207681',
      registry: '0xeE52d780A47F77E8a4a1cEb236e3C65A48FbD828',
      reputation: '0x4A6374Fae37E19E69ba43E7cf6994AC15F63256e',
      usdc: '0x317227efcA18D004E12CA8046AEf7E1597458F25',
    },
    indexer: 'https://indexer-storage-testnet-turbo.0g.ai',
    broker: 'https://broker.testnet.0g.ai',
    explorer: 'https://chainscan-galileo.0g.ai',
  },
} as const satisfies Record<string, Network>;

export type NetworkName = keyof typeof networks;
