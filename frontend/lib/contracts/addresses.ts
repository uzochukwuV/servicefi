// ServiceFi Contract Addresses
// Update these after deployment

import { mantleSepoliaTestnet } from "viem/chains";

export const CONTRACT_ADDRESSES = {
  // Mantle Testnet (Chain ID: 5003) - Deployed Dec 22, 2024
  
  "mantleSepoliaTestnet": {
    "serviceCreditToken": "0x559B5D73861221114c6aA5F08fCA14445B802d7F",
    "liquidityPool": "0x9326e8AEC03cFfb5e7D7a6f431396BeB31fdDF15",
    "redemptionOracle": "0xA3cfF6bC5Fd24061A80A727a8075f990C2b677C6",
    "marketplace": "0x0000000000000000000000000000000000000000" // TODO: Update after redeployment
  },
  // Mantle Mainnet (Chain ID: 5000)
  mantleMainnet: {
    serviceCreditToken: "0x0000000000000000000000000000000000000000", // TODO: Update after deployment
    liquidityPool: "0x0000000000000000000000000000000000000000", // TODO: Update after deployment
    redemptionOracle: "0x0000000000000000000000000000000000000000", // TODO: Update after deployment
    marketplace: "0x0000000000000000000000000000000000000000", // TODO: Update after deployment
    serviceFactory: "0x0000000000000000000000000000000000000000", // TODO: Update after deployment
  },
} as const;

export type ChainName = keyof typeof CONTRACT_ADDRESSES;

export function getContractAddress(chain: ChainName, contract: keyof typeof CONTRACT_ADDRESSES.mantleSepoliaTestnet) {
  return CONTRACT_ADDRESSES[chain][contract];
}

// Chain configurations
export const SUPPORTED_CHAINS = {
 mantleSepoliaTestnet,
  mantleMainnet: {
    id: 5000,
    name: "Mantle",
    rpcUrl: "https://rpc.mantle.xyz",
    blockExplorer: "https://explorer.mantle.xyz",
    nativeCurrency: {
      name: "Mantle",
      symbol: "MNT",
      decimals: 18,
    },
  },
} as const;
