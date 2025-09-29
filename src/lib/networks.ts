// src/lib/networks.ts
export type ChainId = "solana:mainnet" | "eip155:8453" | "eip155:137" | "eip155:1";

export const CHAIN_NAME: Record<ChainId, string> = {
  "solana:mainnet": "Solana",
  "eip155:8453": "Base",
  "eip155:137": "Polygon",
  "eip155:1": "Ethereum",
};

// Ranking simple de coste/rapidez (barato → caro)
export const CHEAPEST_RANK: ChainId[] = [
  "solana:mainnet",
  "eip155:8453",
  "eip155:137",
  "eip155:1",
];

export const pickCheapest = (available: ChainId[]): ChainId => {
  for (const cid of CHEAPEST_RANK) if (available.includes(cid)) return cid;
  // fallback: primera disponible
  return available[0];
};

// Catálogo de redes disponibles por token (MVP local)
export type CurrencyId = "USDC.circle" | "USDT.tether" | "ETH.native" | "SOL.native" | "POL.native";

export const TOKEN_CHAINS: Record<CurrencyId, ChainId[]> = {
  "USDC.circle": ["solana:mainnet","eip155:8453","eip155:137","eip155:1"],
  "USDT.tether": ["solana:mainnet","eip155:8453","eip155:137","eip155:1"],
  "ETH.native": ["eip155:1"],
  "SOL.native": ["solana:mainnet"],
  "POL.native": ["eip155:137"],
};