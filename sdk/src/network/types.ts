import type { Address } from '../types.js';

export interface NetworkContracts {
  escrow: Address;
  registry: Address;
  reputation: Address;
  usdc: Address;
}

export interface Network {
  name: string;
  chainId: bigint;
  rpc: string[];
  contracts: NetworkContracts;
  indexer: string;
  broker: string;
  explorer?: string;
}
