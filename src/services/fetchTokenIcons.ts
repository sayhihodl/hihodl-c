// src/services/fetchTokenIcons.ts
// Enriquecer tokens del catálogo local con iconos desde CoinGecko
import { TOKENS_CATALOG } from "@/config/tokensCatalog";
import { logger } from "@/utils/logger";

const COINGECKO_BASE = "https://api.coingecko.com/api/v3";
const ICON_CACHE = new Map<string, { url: string; ts: number }>();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 horas

/** Obtiene el icono de un token desde CoinGecko usando su coin ID */
async function fetchTokenIconFromCoinGecko(coinId: string): Promise<string | undefined> {
  // Verificar cache
  const cached = ICON_CACHE.get(coinId);
  if (cached && Date.now() - cached.ts < CACHE_TTL) {
    return cached.url;
  }

  try {
    // Usar la API de CoinGecko para obtener imagen directamente
    // Endpoint más eficiente: /coins/{id} solo con image
    const url = `${COINGECKO_BASE}/coins/${coinId}?localization=false&tickers=false&market_data=false&community_data=false&developer_data=false&sparkline=false`;
    const res = await fetch(url, {
      headers: { "Accept": "application/json" },
    });

    if (!res.ok) {
      logger.debug("[fetchTokenIcons] HTTP", res.status, coinId);
      return undefined;
    }

    const data = (await res.json()) as {
      image?: string | { small?: string; thumb?: string; large?: string };
    };

    // CoinGecko puede devolver image como string o como objeto
    let imageUrl: string | undefined;
    if (typeof data.image === "string") {
      imageUrl = data.image;
    } else if (data.image) {
      imageUrl = data.image.large || data.image.thumb || data.image.small;
    }
    
    if (imageUrl) {
      ICON_CACHE.set(coinId, { url: imageUrl, ts: Date.now() });
      return imageUrl;
    }
  } catch (e) {
    logger.debug("[fetchTokenIcons] error", coinId, String(e));
  }

  return undefined;
}

/** Enriquece tokens del catálogo con iconos desde CoinGecko (en paralelo) */
export async function enrichCatalogTokensWithIcons(): Promise<Map<string, string>> {
  const iconMap = new Map<string, string>(); // tokenId -> iconUrl

  // Obtener todos los tokens del catálogo que tienen coingeckoId pero no logoURI
  const tokensToEnrich = (TOKENS_CATALOG as any[]).filter((t) => {
    return t.coingeckoId && !t.logoURI && !t.logo;
  });

  if (tokensToEnrich.length === 0) {
    logger.debug("[fetchTokenIcons] no tokens to enrich");
    return iconMap;
  }

  logger.debug("[fetchTokenIcons] enriching", tokensToEnrich.length, "tokens");

  // Fetch en paralelo (limitado a 10 para evitar rate limits)
  const tokensToFetch = tokensToEnrich.slice(0, 10);
  const promises = tokensToFetch.map(async (token) => {
    try {
      const iconUrl = await fetchTokenIconFromCoinGecko(token.coingeckoId);
      if (iconUrl) {
        iconMap.set(token.id, iconUrl);
        logger.debug("[fetchTokenIcons] got icon for", token.symbol, iconUrl);
      }
    } catch (e) {
      logger.debug("[fetchTokenIcons] failed for", token.symbol, String(e));
    }
  });

  await Promise.allSettled(promises);

  logger.debug("[fetchTokenIcons] enriched", iconMap.size, "tokens");
  return iconMap;
}

