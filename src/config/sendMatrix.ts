// src/config/sendMatrix.ts
export type ChainKey = "solana" | "base" | "polygon" | "ethereum";
export type TokenKey = "usdc" | "usdt" | "eth" | "sol" | "matic";

/** Normaliza ids de token varios a una clave estable */
export function normalizeTokenId(id?: string): TokenKey | null {
  if (!id) return null;
  const s = id.toLowerCase().replace(".circle", "").replace(".native", "").trim();
  if (s.startsWith("usdc")) return "usdc";
  if (s.startsWith("usdt") || s.startsWith("tether")) return "usdt";
  if (s === "sol" || s.startsWith("solana")) return "sol";
  if (s === "eth" || s.startsWith("ethereum")) return "eth";
  if (s === "matic" || s.startsWith("polygon")) return "matic";
  return null;
}

/** Dónde existe cada token (whitelist) */
export const TOKEN_ALLOWED_CHAINS: Record<TokenKey, ChainKey[]> = {
  // Stables: prioriza redes rápidas y baratas
  usdc: ["solana", "base", "polygon", "ethereum"],
  usdt: ["solana", "base", "polygon", "ethereum"],
  // Nativos
  sol:  ["solana"],
  eth:  ["base", "ethereum", "polygon"], // preferimos Base para gas barato
  matic:["polygon"],
};

/** Orden de preferencia (barato/rápido) por familia de token */
const PREF_ORDER: Record<TokenKey, ChainKey[]> = {
  usdc: ["solana", "base", "polygon", "ethereum"],
  usdt: ["solana", "base", "polygon", "ethereum"],
  eth:  ["base", "ethereum", "polygon"],
  sol:  ["solana"],
  matic:["polygon"],
};

export function isPairAllowed(tokenIdLower: string, chain: ChainKey): boolean {
  const t = normalizeTokenId(tokenIdLower);
  if (!t) return false;
  return TOKEN_ALLOWED_CHAINS[t].includes(chain);
}

/** Si la pareja no es válida, devuelve la red preferida válida */
export function coercePair(tokenIdLower: string, chain: ChainKey): ChainKey {
  const t = normalizeTokenId(tokenIdLower);
  if (!t) return chain;
  return TOKEN_ALLOWED_CHAINS[t].includes(chain) ? chain : PREF_ORDER[t][0];
}

/** Dada una lista de chains candidatas, elige la mejor válida para ese token */
export function bestChainForToken(tokenIdLower: string, candidates?: ChainKey[]): ChainKey | null {
  const t = normalizeTokenId(tokenIdLower);
  if (!t) return null;
  const order = PREF_ORDER[t];
  const allowed = TOKEN_ALLOWED_CHAINS[t];
  const pool = candidates?.length ? order.filter((c) => candidates.includes(c)) : order;
  return (pool.find((c) => allowed.includes(c)) ?? null);
}