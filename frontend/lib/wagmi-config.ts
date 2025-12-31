'use client';

import { http, createConfig } from 'wagmi';
import { mantle, mantleSepoliaTestnet } from 'wagmi/chains';
import { injected } from 'wagmi/connectors';

// Simplified config without WalletConnect to avoid build issues
// WalletConnect can be added later after fixing Turbopack issues
export const config = createConfig({
  chains: [mantleSepoliaTestnet, mantle],
  connectors: [
    injected(),
  ],
  transports: {
    [mantleSepoliaTestnet.id]: http('https://mantle-sepolia.drpc.org'),
    [mantle.id]: http('https://rpc.mantle.xyz'),
  },
});

declare module 'wagmi' {
  interface Register {
    config: typeof config;
  }
}
