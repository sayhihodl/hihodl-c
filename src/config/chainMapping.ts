// src/config/chainMapping.ts
// Mapeo centralizado entre ChainKey y ChainId
import type { ChainId } from "@/store/portfolio.store";
import type { ChainKey } from "@/config/sendMatrix";

/** Mapeo de ChainKey (formato UI) a ChainId (formato store) */
export const CHAIN_KEY_TO_ID: Record<ChainKey, ChainId> = {
  ethereum: "eip155:1",
  base: "eip155:8453",
  polygon: "eip155:137",
  solana: "solana:mainnet",
} as const;

/** Mapeo inverso: ChainId → ChainKey */
export const CHAIN_ID_TO_KEY: Record<ChainId, ChainKey> = {
  "eip155:1": "ethereum",
  "eip155:8453": "base",
  "eip155:137": "polygon",
  "solana:mainnet": "solana",
} as const;

/**
 * Convierte ChainKey a ChainId
 */
export function chainKeyToId(key: ChainKey): ChainId {
  return CHAIN_KEY_TO_ID[key];
}

/**
 * Convierte ChainId a ChainKey
 */
export function chainIdToKey(id: ChainId): ChainKey {
  return CHAIN_ID_TO_KEY[id];
}

/**
 * Obtiene ChainId de forma segura con fallback
 */
export function getChainId(key: ChainKey, fallback: ChainId = "eip155:1"): ChainId {
  return CHAIN_KEY_TO_ID[key] ?? fallback;
}

