// src/services/jupiter.ts
import { logger } from "@/utils/logger";

const JUP_BASE = "https://lite-api.jup.ag/tokens/v2"; // no requiere API key

export type JupToken = {
  id: string; // mint address
  symbol: string;
  name: string;
  decimals: number;
  icon?: string; // logo URL
  isVerified?: boolean;
  organicScore?: number;
};

async function jupFetch<T>(path: string, { signal }: { signal?: AbortSignal } = {}): Promise<T> {
  const res = await fetch(`${JUP_BASE}${path}`, {
    signal,
    headers: { accept: "application/json" },
  });
  if (!res.ok) throw new Error(`Jupiter API error ${res.status}`);
  const data = await res.json();
  if (!data) return [] as unknown as T;
  return data as T;
}

// Tipo para respuesta raw de Jupiter API
type JupiterTokenRaw = {
  id?: string;
  address?: string;
  mint?: string;
  symbol?: string;
  name?: string;
  decimals?: number;
  icon?: string;
  isVerified?: boolean;
  organicScore?: number;
};

/** Busca tokens por símbolo, nombre o mint. Normaliza el resultado. */
export async function jupSearch(query: string, signal?: AbortSignal): Promise<JupToken[]> {
  if (!query?.trim()) return [];
  const q = encodeURIComponent(query.trim());
  try {
    const raw = await jupFetch<JupiterTokenRaw[]>(`/search?query=${q}`, { signal });
    if (!Array.isArray(raw)) return [];

    return raw.map((t) => ({
      id: String(t.id || t.address || t.mint || ""),
      symbol: String(t.symbol || t.name || "UNKNOWN"),
      name: String(t.name || t.symbol || t.id || ""),
      decimals: typeof t.decimals === "number" ? t.decimals : 6,
      icon: typeof t.icon === "string" ? t.icon : undefined,
      isVerified: !!t.isVerified,
      organicScore: typeof t.organicScore === "number" ? t.organicScore : undefined,
    }));
  } catch (err) {
    logger.error("jupSearch error:", err);
    return [];
  }
}

/** Tokens por tag (e.g. verified o lst). */
export async function jupByTag(tag: "verified" | "lst", signal?: AbortSignal): Promise<JupToken[]> {
  return jupFetch<JupToken[]>(`/tag?query=${tag}`, { signal });
}

/** Categorías útiles (Trending, Top organic score, etc.) */
export async function jupCategory(
  cat: "toporganicscore" | "toptraded" | "toptrending",
  interval: "5m" | "1h" | "6h" | "24h" = "24h",
  limit = 50,
  signal?: AbortSignal
): Promise<JupToken[]> {
  return jupFetch<JupToken[]>(`/${cat}/${interval}?limit=${limit}`, { signal });
}

/** Dado un mint exacto o varios separados por coma. */
export async function jupByMint(mint: string, signal?: AbortSignal): Promise<JupToken[]> {
  if (!mint) return [];
  const q = encodeURIComponent(mint);
  try {
    const res = await jupFetch<JupiterTokenRaw[]>(`/search?query=${q}`, { signal });
    return Array.isArray(res)
      ? res.map((t) => ({
          id: String(t.id || ""),
          symbol: String(t.symbol || t.name || "UNKNOWN"),
          name: String(t.name || t.symbol || t.id || ""),
          decimals: typeof t.decimals === "number" ? t.decimals : 6,
          icon: typeof t.icon === "string" ? t.icon : undefined,
          isVerified: !!t.isVerified,
          organicScore: typeof t.organicScore === "number" ? t.organicScore : undefined,
        }))
      : [];
  } catch (e) {
    logger.error("jupByMint error:", e);
    return [];
  }
}