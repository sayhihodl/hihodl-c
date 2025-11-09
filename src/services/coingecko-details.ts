// src/services/coingecko-details.ts
// Servicio para obtener detalles completos de tokens desde CoinGecko
import { logger } from "@/utils/logger";

export type CoinGeckoTokenDetails = {
  id: string;
  symbol: string;
  name: string;
  image?: string;
  market_cap?: number;
  market_cap_rank?: number;
  current_price?: number;
  price_change_percentage_24h?: number;
  platforms?: Record<string, string>; // { "ethereum": "0x...", "base": "0x...", "polygon-pos": "0x..." }
  sparkline_7d?: number[];
};

const COINGECKO_BASE = "https://api.coingecko.com/api/v3";
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos
const cache = new Map<string, { data: CoinGeckoTokenDetails; ts: number }>();

/**
 * Obtiene detalles completos de un token desde CoinGecko usando su coin ID
 */
export async function getTokenDetailsFromCoinGecko(
  coinId: string,
  signal?: AbortSignal
): Promise<CoinGeckoTokenDetails | null> {
  // Verificar cache
  const cached = cache.get(coinId);
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return cached.data;
  }

  try {
    // Usar el endpoint de markets que incluye market cap y precios
    const url = `${COINGECKO_BASE}/coins/markets?vs_currency=usd&ids=${encodeURIComponent(coinId)}&order=market_cap_desc&per_page=1&page=1&sparkline=true&price_change_percentage=24h`;
    const controller = signal ? undefined : new AbortController();
    const timeout = setTimeout(() => controller?.abort(), 10000);

    const res = await fetch(url, {
      signal: signal || controller?.signal,
      headers: { "Accept": "application/json" },
    });

    clearTimeout(timeout);

    if (!res.ok) {
      logger.debug("[coingecko-details] HTTP", res.status, coinId);
      return null;
    }

    const data = (await res.json()) as Array<{
      id: string;
      symbol: string;
      name: string;
      image?: string;
      market_cap?: number;
      market_cap_rank?: number;
      current_price?: number;
      price_change_percentage_24h?: number;
      sparkline_in_7d?: { price?: number[] };
    }>;

    if (!data || data.length === 0) {
      logger.debug("[coingecko-details] no data", coinId);
      return null;
    }

    const market = data[0];

    // Obtener platforms (contract addresses) desde el endpoint detallado
    let platforms: Record<string, string> | undefined;
    try {
      const detailUrl = `${COINGECKO_BASE}/coins/${coinId}?localization=false&tickers=false&market_data=false&community_data=false&developer_data=false&sparkline=false`;
      const detailRes = await fetch(detailUrl, {
        signal: signal || controller?.signal,
        headers: { "Accept": "application/json" },
      });

      if (detailRes.ok) {
        const detailData = (await detailRes.json()) as {
          platforms?: Record<string, string>;
        };
        platforms = detailData.platforms;
      }
    } catch (e) {
      logger.debug("[coingecko-details] platforms fetch error", coinId, String(e));
    }

    const details: CoinGeckoTokenDetails = {
      id: market.id,
      symbol: market.symbol?.toUpperCase() || "",
      name: market.name || "",
      image: market.image,
      market_cap: market.market_cap,
      market_cap_rank: market.market_cap_rank,
      current_price: market.current_price,
      price_change_percentage_24h: market.price_change_percentage_24h,
      platforms,
      sparkline_7d: market.sparkline_in_7d?.price,
    };

    cache.set(coinId, { data: details, ts: Date.now() });
    return details;
  } catch (e: any) {
    if (e.name === "AbortError") return null;
    logger.debug("[coingecko-details] error", coinId, String(e?.message ?? e));
    return null;
  }
}

/**
 * Formatea market cap a string legible (e.g., "$72.67B", "$1.23M")
 */
export function formatMarketCap(marketCap?: number): string | null {
  if (!marketCap || marketCap === 0) return null;

  if (marketCap >= 1_000_000_000_000) {
    return `$${(marketCap / 1_000_000_000_000).toFixed(2)}T`;
  }
  if (marketCap >= 1_000_000_000) {
    return `$${(marketCap / 1_000_000_000).toFixed(2)}B`;
  }
  if (marketCap >= 1_000_000) {
    return `$${(marketCap / 1_000_000).toFixed(2)}M`;
  }
  if (marketCap >= 1_000) {
    return `$${(marketCap / 1_000).toFixed(2)}K`;
  }
  return `$${marketCap.toFixed(2)}`;
}

/**
 * Mapea NetworkKey a CoinGecko platform key
 */
export function networkKeyToCoinGeckoPlatform(network: "solana" | "base" | "ethereum" | "polygon"): string {
  const map: Record<string, string> = {
    ethereum: "ethereum",
    base: "base",
    polygon: "polygon-pos",
    solana: "solana", // CoinGecko usa "solana" para Solana
  };
  return map[network] || network;
}

/**
 * Obtiene el contract address de un token en una network específica
 */
export function getContractAddressFromPlatforms(
  platforms: Record<string, string> | undefined,
  network: "solana" | "base" | "ethereum" | "polygon"
): string | undefined {
  if (!platforms) return undefined;

  const cgPlatform = networkKeyToCoinGeckoPlatform(network);
  return platforms[cgPlatform];
}


