import { createConfig } from '@privy-io/wagmi';
import { http } from 'wagmi';
import { ogTestnet } from './chains';

// wagmi config — Privy provides the connector at runtime via PrivyProvider +
// WagmiProvider from @privy-io/wagmi. We just declare the chain + transport.
export const wagmiConfig = createConfig({
  chains: [ogTestnet],
  transports: {
    [ogTestnet.id]: http(),
  },
});
