// src/config/tokensCatalog.ts
import type { ChainId, CurrencyId } from "@/store/portfolio.store";

export type TokenMeta = {
  id: CurrencyId;
  symbol: string;
  name: string;
  decimals: number;
  logo?: any;

  // NUEVO
  nativeChainId: ChainId;      // cadena “de origen”
  supportedChains: ChainId[];  // TODAS las cadenas donde está disponible
  isNative?: boolean;          // marca opcional para nativos “puros”
};

export const TOKENS_CATALOG: TokenMeta[] = [
  {
    id: "USDC.circle" as CurrencyId,
    symbol: "USDC",
    name: "USD Coin",
    decimals: 6,
    nativeChainId: "eip155:1" as ChainId,
    supportedChains: ["eip155:1", "solana:mainnet", "eip155:8453", "eip155:137"] as ChainId[],
  },
  {
    id: "USDT.tether" as CurrencyId,
    symbol: "USDT",
    name: "Tether",
    decimals: 6,
    nativeChainId: "eip155:1" as ChainId,              // ajusta si prefieres otra nativa
    supportedChains: ["eip155:1", "solana:mainnet", "eip155:8453", "eip155:137"] as ChainId[],
  },
  {
    id: "ETH.native" as CurrencyId,
    symbol: "ETH",
    name: "Ethereum",
    decimals: 18,
    nativeChainId: "eip155:1" as ChainId,
    supportedChains: ["eip155:1"] as ChainId[],
    isNative: true,
  },
  {
    id: "SOL.native" as CurrencyId,
    symbol: "SOL",
    name: "Solana",
    decimals: 9,
    nativeChainId: "solana:mainnet" as ChainId,
    supportedChains: ["solana:mainnet"] as ChainId[],
    isNative: true,
  },
];

export function useTokenCatalog(chainId?: ChainId) {
  const all = TOKENS_CATALOG;
  if (!chainId) return all;
  // filtra tokens que están disponibles en esa chain
  return all.filter(t => t.supportedChains.includes(chainId));
}