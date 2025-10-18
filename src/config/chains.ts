export const APP_SUPPORTED_CHAINS = [
  "eip155:1",        // Ethereum
  "eip155:8453",     // Base
  "eip155:137",      // Polygon
  "solana:mainnet",  // Solana
] as const;

export type SupportedChainId = typeof APP_SUPPORTED_CHAINS[number];