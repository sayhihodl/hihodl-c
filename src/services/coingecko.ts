// src/services/coingecko.ts
// Búsqueda de tokens EVM usando CoinGecko API (gratis, sin API key)
import { logger } from "@/utils/logger";

export type CoinGeckoToken = {
  id: string;
  symbol: string;
  name: string;
  platforms?: Record<string, string>; // { "ethereum": "0x...", "base": "0x...", "polygon-pos": "0x..." }
  image?: string;
  market_cap_rank?: number;
};

const COINGECKO_BASE = "https://api.coingecko.com/api/v3";
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos
const cache = new Map<string, { data: CoinGeckoToken[]; ts: number }>();

/** Busca tokens en CoinGecko por query */
export async function searchCoinGecko(
  query: string,
  signal?: AbortSignal
): Promise<CoinGeckoToken[]> {
  const q = query.trim().toLowerCase();
  if (!q || q.length < 2) return [];

  const cacheKey = `search:${q}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return cached.data;
  }

  try {
    const url = `${COINGECKO_BASE}/search?query=${encodeURIComponent(q)}`;
    const controller = signal ? undefined : new AbortController();
    const timeout = setTimeout(() => controller?.abort(), 5000);

    const res = await fetch(url, {
      signal: signal || controller?.signal,
      headers: { "Accept": "application/json" },
    });

    clearTimeout(timeout);

    if (!res.ok) {
      logger.debug("[coingecko] HTTP", res.status);
      return [];
    }

    const data = (await res.json()) as {
      coins?: Array<{ id: string; name: string; symbol: string; api_symbol?: string; thumb?: string; large?: string }>;
    };

    if (!data?.coins?.length) return [];

    // Mapear a nuestro formato y obtener detalles de plataformas
    const tokens: CoinGeckoToken[] = [];
    const coinIds = data.coins.slice(0, 20).map((c) => c.id); // Limitar a 20 para details

    if (coinIds.length) {
      // Fetch details para obtener addresses en diferentes chains
      try {
        const detailsUrl = `${COINGECKO_BASE}/coins/markets?vs_currency=usd&ids=${coinIds.join(",")}&order=market_cap_desc&per_page=20&page=1&sparkline=false`;
        const detailsRes = await fetch(detailsUrl, {
          signal: signal || controller?.signal,
          headers: { "Accept": "application/json" },
        });

        if (detailsRes.ok) {
          const details = (await detailsRes.json()) as Array<{
            id: string;
            symbol: string;
            name: string;
            image?: string;
            market_cap_rank?: number;
          }>;

          for (const coin of data.coins) {
            const detail = details.find((d) => d.id === coin.id);
            tokens.push({
              id: coin.id,
              symbol: coin.symbol?.toUpperCase() || coin.api_symbol?.toUpperCase() || "",
              name: coin.name || coin.id,
              image: detail?.image || coin.large || coin.thumb,
              market_cap_rank: detail?.market_cap_rank,
            });
          }
        } else {
          // Fallback: usar solo search results
          for (const coin of data.coins) {
            tokens.push({
              id: coin.id,
              symbol: coin.symbol?.toUpperCase() || coin.api_symbol?.toUpperCase() || "",
              name: coin.name || coin.id,
              image: coin.large || coin.thumb,
            });
          }
        }
      } catch (e) {
        logger.debug("[coingecko] details error", String(e));
        // Fallback sin details
        for (const coin of data.coins) {
          tokens.push({
            id: coin.id,
            symbol: coin.symbol?.toUpperCase() || coin.api_symbol?.toUpperCase() || "",
            name: coin.name || coin.id,
            image: coin.large || coin.thumb,
          });
        }
      }
    }

    // Obtener platform addresses para TODOS los tokens (no solo el primero)
    // IMPORTANTE: CoinGecko requiere platforms para mapear tokens a chains EVM
    if (tokens.length > 0) {
      // Fetch platforms en paralelo para todos los tokens (aumentado a 20 para mejor cobertura)
      const tokensToFetch = tokens.slice(0, 20);
      const platformPromises = tokensToFetch.map(async (token) => {
        try {
          const platformUrl = `${COINGECKO_BASE}/coins/${token.id}?localization=false&tickers=false&market_data=false&community_data=false&developer_data=false&sparkline=false`;
          const platformRes = await fetch(platformUrl, {
            signal: signal || controller?.signal,
            headers: { "Accept": "application/json" },
          });

          if (platformRes.ok) {
            const platformData = (await platformRes.json()) as {
              platforms?: Record<string, string>;
            };
            if (platformData.platforms && Object.keys(platformData.platforms).length > 0) {
              token.platforms = platformData.platforms;
              logger.debug("[coingecko] got platforms for", token.symbol, Object.keys(platformData.platforms));
            } else {
              logger.debug("[coingecko] no platforms found for", token.symbol, token.id);
            }
          } else {
            logger.debug("[coingecko] platform fetch failed", platformRes.status, token.id);
          }
        } catch (e) {
          // Ignorar errores individuales pero loguear para debug
          logger.debug("[coingecko] platform fetch error for", token.id, String(e));
        }
      });

      // Esperar todas las requests en paralelo (con timeout)
      try {
        const results = await Promise.allSettled(platformPromises);
        const successCount = results.filter(r => r.status === "fulfilled").length;
        const tokensWithPlatforms = tokens.filter(t => t.platforms && Object.keys(t.platforms).length > 0).length;
        logger.debug("[coingecko] platform fetch completed", successCount, "/", tokensToFetch.length, "- tokens with platforms:", tokensWithPlatforms);
        
        // Si muy pocos tokens tienen platforms, puede ser un problema de rate limit o timeout
        if (tokensWithPlatforms === 0 && tokens.length > 0) {
          logger.debug("[coingecko] WARNING: No tokens have platforms - may indicate rate limit or timeout issue");
        }
      } catch (e) {
        logger.debug("[coingecko] platform fetch global error", String(e));
      }
    } else {
      logger.debug("[coingecko] no tokens to fetch platforms for");
    }

    cache.set(cacheKey, { data: tokens, ts: Date.now() });
    return tokens;
  } catch (e: any) {
    if (e.name === "AbortError") return [];
    logger.debug("[coingecko] search error", String(e?.message ?? e));
    return [];
  }
}

/** Obtiene el address de un token en una chain específica desde CoinGecko */
export async function getTokenAddressOnChain(
  coinId: string,
  chain: "ethereum" | "base" | "polygon",
  signal?: AbortSignal
): Promise<string | undefined> {
  const chainMap: Record<string, string> = {
    ethereum: "ethereum",
    base: "base",
    polygon: "polygon-pos",
  };

  const coingeckoChain = chainMap[chain];
  if (!coingeckoChain) return undefined;

  try {
    const url = `${COINGECKO_BASE}/coins/${coinId}?localization=false&tickers=false&market_data=false&community_data=false&developer_data=false&sparkline=false`;
    const res = await fetch(url, {
      signal,
      headers: { "Accept": "application/json" },
    });

    if (!res.ok) return undefined;

    const data = (await res.json()) as {
      platforms?: Record<string, string>;
    };

    return data.platforms?.[coingeckoChain];
  } catch (e) {
    logger.debug("[coingecko] address lookup error", String(e));
    return undefined;
  }
}


