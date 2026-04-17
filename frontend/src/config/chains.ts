import { defineChain } from 'viem';

export const ogTestnet = defineChain({
  id: 16602,
  name: '0G Testnet',
  network: '0g-testnet',
  nativeCurrency: { decimals: 18, name: 'A0GI', symbol: 'A0GI' },
  rpcUrls: { default: { http: ['https://evmrpc-testnet.0g.ai'] } },
  blockExplorers: { default: { name: '0G Scan', url: 'https://chainscan-newton.0g.ai' } },
});
