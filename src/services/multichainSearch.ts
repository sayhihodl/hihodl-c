// src/services/multichainSearch.ts
import { searchTokens } from "@/search/tokensIndex";
import { TOKENS_CATALOG } from "@/config/tokensCatalog";
import { jupSearch } from "@/services/jupiter";
import { enrichEvmTokens } from "@/services/alchemy"; // opcional, si no hay KEY seguirá funcionando
import { searchCoinGecko, getTokenAddressOnChain } from "@/services/coingecko";
import { enrichCatalogTokensWithIcons } from "@/services/fetchTokenIcons";
import type { ChainKey } from "@/send/types";
import { logger } from "@/utils/logger";

/** ===== Tipos consumidos por StepToken ===== */
export type MCItem = {
  id: string;               // tokenId (namespaced o mint/addr)
  chain: ChainKey;          // "solana" | "ethereum" | "base" | "polygon" | ...
  symbol: string;
  name?: string;
  decimals?: number;
  brand?: string;
  iconUrl?: string;
  reason?: "needs_meta" | "unsupported_chain";
  address?: string;        // Contract address para EVM o mint para Solana
  marketCapRank?: number; // Market cap rank from CoinGecko (lower = better, top 100 = official)
};

// Token agrupado: un símbolo con todas sus chains disponibles
export type TokenGroup = {
  symbol: string;
  name: string;
  iconUrl?: string;
  brand?: string;
  variants: Array<{
    chain: ChainKey;
    id: string;
    decimals?: number;
    address?: string;
    reason?: MCItem["reason"];
  }>;
  // Chain auto-seleccionada basada en reglas
  bestChain?: ChainKey;
};

export type MCGroup = { key: string; title: string; items: MCItem[] };

/** ===== debug helper ===== */
const dbg = (...x: unknown[]): void => { 
  try { 
    logger.debug("[mcs]", ...x); 
  } catch {
    // Ignore logger errors
  } 
};

/** ===== EVM types para Alchemy ===== */
type EvmChain = "ethereum" | "base" | "polygon";
const asEvmChain = (k: ChainKey): EvmChain | undefined =>
  k === "ethereum" || k === "base" || k === "polygon" ? k : undefined;

/** ===== helpers ===== */
const CHAIN_ID_TO_KEY: Record<string, ChainKey | undefined> = {
  "solana:mainnet": "solana",
  "eip155:1": "ethereum",
  "eip155:137": "polygon",
  "eip155:8453": "base",
};

// ChainKey en tu app tiene más redes; solo definimos las que usamos aquí.
const KEY_TO_CHAIN_ID: Partial<Record<ChainKey, string>> = {
  solana: "solana:mainnet",
  ethereum: "eip155:1",
  polygon: "eip155:137",
  base: "eip155:8453",
};

const isSolMint = (s: string) => /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(s.trim());
const isHexAddr = (s: string) => /^0x[a-fA-F0-9]{40}$/.test(s.trim());

/** ===== Fallback estático de recomendados (si el catálogo falla) ===== */
const STATIC_RECS: MCItem[] = [
  { id: "USDC.circle", chain: "ethereum", symbol: "USDC", name: "USD Coin" },
  { id: "USDT.tether", chain: "ethereum", symbol: "USDT", name: "Tether" },
  { id: "ETH.native",  chain: "ethereum", symbol: "ETH",  name: "Ethereum" },
  { id: "SOL.native",  chain: "solana",   symbol: "SOL",  name: "Solana" },
  { id: "USDC.circle", chain: "base",     symbol: "USDC", name: "USD Coin" },
  { id: "USDC.circle", chain: "polygon",  symbol: "USDC", name: "USD Coin" },
];

/** Mapea catálogo local → MCItems */
function catalogToMCItems(allowChains?: ChainKey[]): MCItem[] {
  if (!Array.isArray(TOKENS_CATALOG) || TOKENS_CATALOG.length === 0) {
    dbg("TOKENS_CATALOG empty");
    return [];
  }
  const set = allowChains ? new Set(allowChains) : undefined;
  const out: MCItem[] = [];

  for (const t of TOKENS_CATALOG as any[]) {
    const chains: string[] = Array.isArray(t.supportedChains) ? t.supportedChains : [];
    for (const cid of chains) {
      const ck = CHAIN_ID_TO_KEY[cid];
      if (!ck) continue;
      if (set && !set.has(ck)) continue;

      // Intentar obtener iconUrl desde múltiples fuentes en orden de confiabilidad:
      // Para tokens de Solana: Jupiter PRIMERO (más confiable que CoinGecko)
      // Para otros tokens: logoURI del catálogo (CoinGecko)
      let iconUrl: string | undefined = undefined;
      
      // PRIORIDAD 1: Para tokens de Solana, usar Jupiter directamente (evita bloqueos de CoinGecko)
      if (cid === "solana:mainnet") {
        const symbolLower = (t.symbol || "").toLowerCase();
        // Mapa de tokens conocidos de Solana en Jupiter con sus mint addresses
        const jupiterKnown: Record<string, string> = {
          "bonk": "DezXAZ8z7PnrnRJjz3wXBoRgixH6nWoQKrPjjkwyqS2P",
          "jup": "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN",
          "wif": "EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm",
          "ray": "4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R",
          "orca": "orcaEKTdK7LKz57vaAYr9QeNsVcfz6ygEbGeQ3Pnj",
          "jto": "jtojtomepa8beP8AuQc6eXt5FriJwfFMwQx2v2f9mCL",
          "msol": "mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So",
          "jitosol": "J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGHPn",
        };
        
        // NOTA: assets.jup.ag no está disponible, los iconos deben venir desde Jupiter API (campo "icon")
        // O usar el logoURI del catálogo (CoinGecko) como fallback
        // El icono real se obtiene cuando se hace búsqueda en Jupiter API, no desde hardcoded URLs
        dbg("catalogToMCItems: Solana token", t.symbol, "- iconUrl vendrá de Jupiter API si se busca");
      }
      
      // PRIORIDAD 2: logoURI del catálogo (solo si no es Solana o no encontramos en Jupiter)
      if (!iconUrl && t.logoURI && typeof t.logoURI === "string") {
        iconUrl = t.logoURI;
        if (!t.logoURI.startsWith("http")) {
          dbg("catalogToMCItems: invalid logoURI for", t.symbol, t.logoURI);
          iconUrl = undefined; // Invalidar si no es http
        }
      }
      
      // PRIORIDAD 3: logo del catálogo
      if (!iconUrl && t.logo) {
        // Si logo es una URL string
        if (typeof t.logo === "string" && (t.logo.startsWith("http://") || t.logo.startsWith("https://"))) {
          iconUrl = t.logo;
        }
      }

      // Debug para tokens sin iconUrl
      if (!iconUrl && (t.symbol === "ORCA" || t.symbol === "RAY" || t.symbol === "WIF" || t.symbol === "JTO" || t.symbol === "JUP")) {
        dbg("catalogToMCItems: NO iconUrl for", t.symbol, "id:", t.id, "logoURI:", t.logoURI, "logo:", typeof t.logo, "chain:", cid);
      }

      out.push({
        id: t.id,
        chain: ck,
        symbol: String(t.symbol || t.id || "").toUpperCase(),
        name: t.name,
        decimals: typeof t.decimals === "number" ? t.decimals : undefined,
        brand: t.brand,
        iconUrl,
        // Guardar coingeckoId para enriquecimiento async
        ...(t.coingeckoId && !iconUrl ? { _coingeckoId: t.coingeckoId } as any : {}),
        // marketCapRank se puede obtener desde CoinGecko usando coingeckoId, pero por ahora lo dejamos undefined
        // Se enriquecerá cuando se busque el token desde CoinGecko
        marketCapRank: undefined,
      });
    }
  }
  // de-dup por (id,chain)
  const uniq = new Map(out.map(i => [`${i.id}-${i.chain}`, i]));
  return Array.from(uniq.values());
}

/** Recommended robusto con fallback estático - DEBE agrupar tokens por símbolo
 *  Prioriza tokens de PAGO (stablecoins) sobre tokens para holdear
 *  También considera tokens usados recientemente por el usuario
 *  ENRIQUECE tokens del catálogo con iconos desde CoinGecko si no tienen logoURI
 *  PRIORIZA tokens con balance sobre lista por defecto
 */
function recommended(
  allowChains?: ChainKey[], 
  recentTokenIds?: string[],
  userBalances?: Record<string, Partial<Record<ChainKey, number>>>,
  lastUsedWithRecipient?: { tokenId: string; chain: ChainKey }  // Último token usado con destinatario específico
): MCGroup[] {
  let items = catalogToMCItems(allowChains);
  if (!items.length) {
    const set = allowChains ? new Set(allowChains) : undefined;
    items = STATIC_RECS.filter(i => !set || set.has(i.chain));
    dbg("recommended from STATIC_RECS", items.length);
  }

  // AGRUPAR tokens por símbolo (igual que en multichainSearch)
  const tokenGroups = new Map<string, {
    symbol: string;
    name: string;
    iconUrl?: string;
    brand?: string;
    variants: Array<{
      chain: ChainKey;
      id: string;
      decimals?: number;
      address?: string;
      reason?: MCItem["reason"];
    }>;
  }>();

  for (const it of items) {
    const symbolKey = it.symbol.toLowerCase();
    
    if (!tokenGroups.has(symbolKey)) {
      // CRÍTICO: Asegurar iconUrl desde el inicio para tokens de Solana (JTO, ORCA, BONK, JITOSOL)
      let iconUrlToUse = it.iconUrl;
      if (!iconUrlToUse) {
        const meta = (TOKENS_CATALOG as any[]).find((t: any) => 
          t.id === it.id || 
          t.id?.toLowerCase() === it.id?.toLowerCase() ||
          (t.symbol && t.symbol.toUpperCase() === it.symbol.toUpperCase())
        );
        
        if (meta) {
          // Para tokens de Solana: Intentar Jupiter primero, CoinGecko como fallback seguro
          if (it.chain === "solana") {
            const symbolLower = (meta.symbol || "").toLowerCase();
            const jupiterKnown: Record<string, string> = {
              "bonk": "DezXAZ8z7PnrnRJjz3wXBoRgixH6nWoQKrPjjkwyqS2P",
              "jup": "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN",
              "wif": "EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm",
              "ray": "4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R",
              "orca": "orcaEKTdK7LKz57vaAYr9QeNsVcfz6ygEbGeQ3Pnj",
              "jto": "jtojtomepa8beP8AuQc6eXt5FriJwfFMwQx2v2f9mCL",
              "msol": "mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So",
              "jitosol": "J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGHPn",
            };
            
            // PRIORIDAD 1: Jupiter (si está en el mapa)
            if (symbolLower && jupiterKnown[symbolLower]) {
              iconUrlToUse = `https://assets.jup.ag/icons/${jupiterKnown[symbolLower]}.png`;
              dbg("recommended: initial grouping - using Jupiter for", it.symbol, iconUrlToUse);
            }
            
            // PRIORIDAD 2: CoinGecko logoURI (SIEMPRE disponible como fallback en catálogo)
            if (!iconUrlToUse && meta.logoURI && typeof meta.logoURI === "string") {
              iconUrlToUse = meta.logoURI;
              dbg("recommended: initial grouping - using logoURI (CoinGecko) for Solana token", it.symbol, iconUrlToUse);
            }
          } else if (meta.logoURI && typeof meta.logoURI === "string") {
            // Para tokens NO-Solana, usar logoURI (CoinGecko)
            iconUrlToUse = meta.logoURI;
          }
        }
      }
      
      tokenGroups.set(symbolKey, {
        symbol: it.symbol,
        name: it.name || it.symbol,
        iconUrl: iconUrlToUse,
        brand: it.brand,
        variants: [{
          chain: it.chain,
          id: it.id,
          decimals: it.decimals,
          address: it.address,
          reason: it.reason,
        }],
      });
    } else {
      const group = tokenGroups.get(symbolKey)!;
      // Solo agregar si es una chain diferente
      const hasChain = group.variants.some(v => v.chain === it.chain);
      if (!hasChain) {
        group.variants.push({
          chain: it.chain,
          id: it.id,
          decimals: it.decimals,
          address: it.address,
          reason: it.reason,
        });
        // Actualizar metadata si es mejor - IMPORTANTE: priorizar iconUrl cuando esté disponible
        if (it.iconUrl && !group.iconUrl) {
          group.iconUrl = it.iconUrl;
        } else if (!group.iconUrl && !it.iconUrl) {
          // Si ninguno tiene iconUrl, intentar obtenerlo usando la misma lógica que catalogToMCItems
          const meta = (TOKENS_CATALOG as any[]).find((t: any) => 
            t.id === it.id || 
            t.id?.toLowerCase() === it.id?.toLowerCase() ||
            (t.symbol && t.symbol.toUpperCase() === it.symbol.toUpperCase())
          );
          
          if (meta) {
            // Para tokens de Solana, usar Jupiter primero
            if (it.chain === "solana") {
              const symbolLower = (meta.symbol || "").toLowerCase();
              const jupiterKnown: Record<string, string> = {
                "bonk": "DezXAZ8z7PnrnRJjz3wXBoRgixH6nWoQKrPjjkwyqS2P",
                "jup": "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN",
                "wif": "EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm",
                "ray": "4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R",
                "orca": "orcaEKTdK7LKz57vaAYr9QeNsVcfz6ygEbGeQ3Pnj",
                "jto": "jtojtomepa8beP8AuQc6eXt5FriJwfFMwQx2v2f9mCL",
                "msol": "mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So",
                "jitosol": "J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGHPn",
              };
              
              if (symbolLower && jupiterKnown[symbolLower]) {
                group.iconUrl = `https://assets.jup.ag/icons/${jupiterKnown[symbolLower]}.png`;
              }
            } else if (meta.logoURI && typeof meta.logoURI === "string") {
              // Para tokens NO-Solana, usar logoURI (CoinGecko)
              group.iconUrl = meta.logoURI;
            }
          }
        }
        if (!group.brand && it.brand) group.brand = it.brand;
        if (!group.name && it.name) group.name = it.name;
      } else {
        // Si ya tiene la chain pero el item actual tiene iconUrl y el grupo no, actualizarlo
        if (it.iconUrl && !group.iconUrl) {
          group.iconUrl = it.iconUrl;
        }
      }
    }
  }

  // Convertir grupos a items con metadata de variants
  const groupedItems: MCItem[] = [];
  
  // Orden de PRIORIDAD para PAGOS (stablecoins y tokens de uso frecuente en transacciones primero)
  // No tokens para holdear, sino para enviar/pagar
  const paymentTokensOrder = ["USDC", "USDT", "DAI"]; // Stablecoins para pagos
  // Nativos para fees/pagos pequeños - orden: SOL → ETH → POL (Polygon después de Solana y Ethereum)
  const nativeTokensOrder = ["SOL", "ETH", "POL"];
  const allOrdered = [...paymentTokensOrder, ...nativeTokensOrder];
  
  for (const [symbolKey, group] of tokenGroups.entries()) {
    // Ordenar variants por popularidad
    const chainPopularity: Record<ChainKey, number> = {
      solana: 100,
      base: 90,
      ethereum: 80,
      polygon: 70,
    };
    group.variants.sort((a, b) => {
      const aPop = chainPopularity[a.chain] || 0;
      const bPop = chainPopularity[b.chain] || 0;
      return bPop - aPop;
    });

    // Auto-seleccionar la mejor chain (primera después de ordenar)
    const bestVariant = group.variants[0];
    if (bestVariant) {
      // CRÍTICO: Asegurar iconUrl para tokens de Solana (JTO, ORCA, BONK, JITOSOL)
      // Prioridad: 1) Jupiter, 2) CoinGecko logoURI (siempre disponible en catálogo)
      let finalIconUrl = group.iconUrl;
      
      if (!finalIconUrl) {
        try {
          const meta = (TOKENS_CATALOG as any[]).find((t: any) => 
            t.id === bestVariant.id || 
            t.id?.toLowerCase() === bestVariant.id?.toLowerCase() ||
            (t.symbol && t.symbol.toUpperCase() === group.symbol.toUpperCase())
          );
          
          if (meta) {
            // Para tokens de Solana: Intentar Jupiter primero, luego CoinGecko como fallback seguro
            if (meta.nativeChainId === "solana:mainnet" || (meta.supportedChains as string[])?.includes("solana:mainnet")) {
              const symbolLower = (meta.symbol || "").toLowerCase();
              const jupiterKnown: Record<string, string> = {
                "bonk": "DezXAZ8z7PnrnRJjz3wXBoRgixH6nWoQKrPjjkwyqS2P",
                "jup": "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN",
                "wif": "EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm",
                "ray": "4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R",
                "orca": "orcaEKTdK7LKz57vaAYr9QeNsVcfz6ygEbGeQ3Pnj",
                "jto": "jtojtomepa8beP8AuQc6eXt5FriJwfFMwQx2v2f9mCL",
                "msol": "mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So",
                "jitosol": "J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGHPn",
              };
              
              // PRIORIDAD 1: Jupiter (si está en el mapa)
              if (symbolLower && jupiterKnown[symbolLower]) {
                finalIconUrl = `https://assets.jup.ag/icons/${jupiterKnown[symbolLower]}.png`;
                dbg("recommended: using Jupiter icon for", group.symbol, finalIconUrl);
              }
              
              // PRIORIDAD 2: CoinGecko logoURI (SIEMPRE disponible como fallback)
              if (!finalIconUrl && meta.logoURI && typeof meta.logoURI === "string") {
                finalIconUrl = meta.logoURI;
                dbg("recommended: using logoURI (CoinGecko) for Solana token", group.symbol, finalIconUrl);
              }
            } else if (meta.logoURI && typeof meta.logoURI === "string") {
              // Para tokens NO-Solana, usar logoURI (CoinGecko)
              finalIconUrl = meta.logoURI;
              dbg("recommended: using logoURI for", group.symbol, finalIconUrl);
            }
          }
        } catch (e) {
          dbg("recommended: error resolving iconUrl", String(e));
        }
      }
      
      // Debug: verificar que finalIconUrl se está asignando para tokens problemáticos
      const debugTokens = ["JTO", "ORCA", "RAY", "WIF", "BONK", "JITOSOL", "PYUSD", "EURC", "cbETH"];
      const itemIconUrl = finalIconUrl || group.iconUrl;
      
      if (debugTokens.includes(group.symbol)) {
        dbg("recommended: finalIconUrl for", group.symbol, "=", finalIconUrl, "group.iconUrl=", group.iconUrl, "bestVariant.id:", bestVariant.id);
        dbg("recommended: ITEM FINAL para", group.symbol, "iconUrl:", itemIconUrl, "id:", bestVariant.id);
      }
      
      groupedItems.push({
        id: bestVariant.id,
        chain: bestVariant.chain,
        symbol: group.symbol,
        name: group.name,
        decimals: bestVariant.decimals,
        brand: group.brand,
        iconUrl: itemIconUrl, // Usar finalIconUrl o group.iconUrl
        reason: bestVariant.reason,
        address: bestVariant.address,
        // Metadata adicional: todas las chains disponibles y sus variants completas
        ...({
          _availableChains: group.variants.map(v => v.chain),
          _variants: group.variants, // Para poder acceder a todos los variants completos
          // Guardar coingeckoId si existe para enriquecimiento async
          ...((group as any)._coingeckoId ? { _coingeckoId: (group as any)._coingeckoId } : {}),
        } as any),
      });
    }
  }

  // Ordenar por PRIORIDAD DE USO EN PAGOS (no por popularidad general para holdear)
  groupedItems.sort((a, b) => {
    // Prioridad -2: Último token usado con ESTE destinatario específico (SEGUNDA OPCIÓN después del favorito)
    // IMPORTANTE: Solo priorizar si el token tiene balance disponible (si no tiene balance, desaparece esta opción)
    if (lastUsedWithRecipient) {
      const lastTokenKey = lastUsedWithRecipient.tokenId.toLowerCase();
      const lastChain = lastUsedWithRecipient.chain;
      
      // Verificar si el último token usado tiene balance disponible
      const lastTokenHasBalance = userBalances?.[lastTokenKey]?.[lastChain] 
        ? (userBalances[lastTokenKey][lastChain] ?? 0) > 0 
        : false;
      
      // Solo priorizar si tiene balance
      if (lastTokenHasBalance) {
        const aMatchesLast = a.id.toLowerCase() === lastTokenKey && 
                            (a as any)._variants?.some((v: any) => v.chain === lastChain);
        const bMatchesLast = b.id.toLowerCase() === lastTokenKey && 
                            (b as any)._variants?.some((v: any) => v.chain === lastChain);
        
        if (aMatchesLast && !bMatchesLast) return -1;
        if (!aMatchesLast && bMatchesLast) return 1;
      }
      // Si no tiene balance, no priorizar (saltar a la siguiente regla de balance)
    }
    
    // Prioridad -1: Tokens con BALANCE (MUY IMPORTANTE - el usuario puede enviar estos tokens)
    // Si el usuario tiene balance en un token, debe aparecer ANTES que tokens sin balance
    if (userBalances) {
      const aTokenKey = a.id.toLowerCase();
      const bTokenKey = b.id.toLowerCase();
      const aHasBalance = Object.values(userBalances[aTokenKey] || {}).some((bal: number | undefined) => (bal ?? 0) > 0);
      const bHasBalance = Object.values(userBalances[bTokenKey] || {}).some((bal: number | undefined) => (bal ?? 0) > 0);
      
      if (aHasBalance && !bHasBalance) return -1;
      if (!aHasBalance && bHasBalance) return 1;
      
      // Si ambos tienen balance, priorizar el que tiene MÁS balance total
      if (aHasBalance && bHasBalance) {
        const aTotal = Object.values(userBalances[aTokenKey] || {}).reduce((s: number, b: number | undefined) => s + (b ?? 0), 0);
        const bTotal = Object.values(userBalances[bTokenKey] || {}).reduce((s: number, b: number | undefined) => s + (b ?? 0), 0);
        if (aTotal !== bTotal) return bTotal - aTotal; // Más balance primero
      }
    }
    
    // Prioridad 0: Tokens usados RECIENTEMENTE por el usuario (más relevantes para pagos)
    // Los tokens que el usuario envía frecuentemente deben aparecer primero
    if (recentTokenIds && recentTokenIds.length > 0) {
      const aInRecent = recentTokenIds.some((rid: string) => 
        rid.toLowerCase() === a.id.toLowerCase() || 
        rid.toLowerCase().includes(a.symbol.toLowerCase())
      );
      const bInRecent = recentTokenIds.some((rid: string) => 
        rid.toLowerCase() === b.id.toLowerCase() || 
        rid.toLowerCase().includes(b.symbol.toLowerCase())
      );
      if (aInRecent && !bInRecent) return -1;
      if (!aInRecent && bInRecent) return 1;
    }
    
    // Prioridad 1: Stablecoins para pagos (USDC, USDT, DAI) - los más usados para enviar dinero
    const aIsPayment = paymentTokensOrder.includes(a.symbol);
    const bIsPayment = paymentTokensOrder.includes(b.symbol);
    if (aIsPayment && !bIsPayment) return -1;
    if (!aIsPayment && bIsPayment) return 1;
    
    // Prioridad 2: Dentro de payment tokens, orden fijo
    if (aIsPayment && bIsPayment) {
      const ia = paymentTokensOrder.indexOf(a.symbol);
      const ib = paymentTokensOrder.indexOf(b.symbol);
      if (ia !== -1 || ib !== -1) return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
    }
    
    // Prioridad 3: Tokens nativos para fees/pagos pequeños (SOL, ETH, POL) - no para holdear
    // Orden: SOL → ETH → POL (Polygon después de Solana y Ethereum)
    const nativeTokensOrder = ["SOL", "ETH", "POL"];
    const aIsNative = nativeTokensOrder.includes(a.symbol);
    const bIsNative = nativeTokensOrder.includes(b.symbol);
    if (aIsNative && !bIsNative) return -1;
    if (!aIsNative && bIsNative) return 1;
    
    // Dentro de nativos, orden fijo: SOL → ETH → POL
    if (aIsNative && bIsNative) {
      const ia = nativeTokensOrder.indexOf(a.symbol);
      const ib = nativeTokensOrder.indexOf(b.symbol);
      if (ia !== -1 || ib !== -1) return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
    }
    
    // Prioridad 4: Tokens con múltiples chains (más flexibilidad para pagos)
    const aVariants = (a as any)._variants as TokenVariant[] | undefined;
    const bVariants = (b as any)._variants as TokenVariant[] | undefined;
    const aMultiChain = aVariants && aVariants.length > 1 ? 1 : 0;
    const bMultiChain = bVariants && bVariants.length > 1 ? 1 : 0;
    if (aMultiChain !== bMultiChain) return bMultiChain - aMultiChain;
    
    // Prioridad 5: Brand/verified tokens (confianza para pagos)
    if (a.brand && !b.brand) return -1;
    if (!a.brand && b.brand) return 1;
    
    // Prioridad 6: Orden alfabético
    return a.symbol.localeCompare(b.symbol);
  });

  dbg("recommended grouped", groupedItems.length, "tokens", Array.from(tokenGroups.values()).map(g => ({ symbol: g.symbol, variants: g.variants.length })));

  // ENRIQUECER iconos: usar cache de iconos desde CoinGecko para tokens sin logoURI
  // Esto se hace de forma asíncrona pero no bloquea la lista inicial
  // Los iconos se cargarán cuando estén disponibles
  (async () => {
    try {
      const iconMap = await enrichCatalogTokensWithIcons();
      if (iconMap.size > 0) {
        // Actualizar items con iconos obtenidos
        for (const item of groupedItems) {
          if (!item.iconUrl && iconMap.has(item.id)) {
            item.iconUrl = iconMap.get(item.id);
          }
        }
        dbg("recommended enriched", iconMap.size, "icons");
      }
    } catch (e) {
      dbg("recommended icon enrich error", String(e));
    }
  })();

  return [{ key: "rec", title: "Recommended", items: groupedItems.slice(0, 50) }];
}

/** Mapea tokens de CoinGecko a MCItems para chains EVM */
function mapCoinGeckoToMCItems(
  cgTokens: Awaited<ReturnType<typeof searchCoinGecko>>,
  allowChains?: ChainKey[]
): MCItem[] {
  const evmChains: ChainKey[] = ["ethereum", "base", "polygon"];
  const allowedEvm = evmChains.filter((c) => !allowChains || allowChains.includes(c));
  if (!allowedEvm.length) {
    dbg("mapCoinGeckoToMCItems: no allowed EVM chains");
    return [];
  }

  const items: MCItem[] = [];
  const chainMap: Record<string, ChainKey> = {
    ethereum: "ethereum",
    base: "base",
    "polygon-pos": "polygon",
  };

  dbg("mapCoinGeckoToMCItems", cgTokens.length, "tokens", allowedEvm.length, "allowed chains");

  let tokensWithPlatforms = 0;
  let tokensWithoutPlatforms = 0;

  for (const token of cgTokens.slice(0, 30)) {
    // Verificar si el token tiene platforms
    if (!token.platforms || Object.keys(token.platforms).length === 0) {
      tokensWithoutPlatforms++;
      dbg("token without platforms", token.symbol, token.id, "- skipping");
      // IMPORTANTE: Si el token no tiene platforms, intentar crear un item con Ethereum como fallback
      // Esto permite que tokens populares aparezcan aunque CoinGecko no haya devuelto platforms inmediatamente
      // Solo hacer esto para tokens con market_cap_rank (tokens conocidos)
      if (token.market_cap_rank && token.market_cap_rank <= 200 && allowedEvm.includes("ethereum")) {
        dbg("creating fallback item for token without platforms", token.symbol, "on ethereum");
        items.push({
          id: `CG:${token.id}:ethereum:unknown`,
          chain: "ethereum",
          symbol: (token.symbol || token.name?.toUpperCase() || "UNKNOWN").toUpperCase(),
          name: token.name,
          iconUrl: token.image,
          brand: token.market_cap_rank && token.market_cap_rank <= 100 ? "verified" : undefined,
          decimals: undefined,
          address: undefined,
          reason: "needs_meta", // Marcar como necesita metadata para que se enriquezca después
          marketCapRank: token.market_cap_rank,
        });
      }
      continue;
    }

    tokensWithPlatforms++;
    // Para cada token de CoinGecko, crear items para cada chain EVM permitida que tenga address
    for (const chainKey of allowedEvm) {
      const platformKey = chainKey === "polygon" ? "polygon-pos" : chainKey;
      const address = token.platforms?.[platformKey];
      
      if (address && address.trim().length > 0) {
        // Usar address como parte del ID para que podamos encontrarlo después
        items.push({
          id: `CG:${token.id}:${chainKey}:${address.toLowerCase()}`,
          chain: chainKey,
          symbol: (token.symbol || token.name?.toUpperCase() || "UNKNOWN").toUpperCase(),
          name: token.name,
          iconUrl: token.image,
          brand: token.market_cap_rank && token.market_cap_rank <= 100 ? "verified" : undefined,
          decimals: undefined, // Se enriquecerá con Alchemy si está disponible
          address: address.toLowerCase(),
          marketCapRank: token.market_cap_rank,
        });
      }
    }
  }

  dbg("mapCoinGeckoToMCItems result", items.length, "items created", "- with platforms:", tokensWithPlatforms, "without platforms:", tokensWithoutPlatforms);
  return items;
}

/** ===== Búsqueda federada mejorada con paralelismo ===== */
export async function multichainSearch(
  q: string, 
  allowChains?: ChainKey[],
  preferredChain?: ChainKey,  // Chain preferida para ranking
  recentTokenIds?: string[],  // Tokens usados recientemente (para priorizar en pagos)
  userBalances?: Record<string, Partial<Record<ChainKey, number>>>,  // Balances del usuario (para priorizar tokens con balance)
  recipient?: string,  // Destinatario para personalización (último token usado con este destinatario será segunda opción)
  lastUsedWithRecipient?: { tokenId: string; chain: ChainKey }  // Último token usado con este destinatario
): Promise<MCGroup[]> {
  const query = (q || "").trim();

  // 1) Sin query → Recommended (SIEMPRE agrupado y ordenado por USO EN PAGOS)
  if (!query) {
    // IMPORTANTE: Para mostrar agrupamiento completo (badge +X, switch network),
    // NO filtrar por chains cuando es la lista inicial (sin query)
    // Esto permite que USDC/USDT muestren todas sus chains disponibles
    const rec = recommended(undefined, recentTokenIds, userBalances, lastUsedWithRecipient); // Forzar undefined para mostrar TODAS las chains
    dbg("recommended", { 
      allowChainsParam: allowChains, // Log del parámetro original
      allowChainsUsed: undefined, // Log de lo que realmente usamos
      totalItems: rec[0]?.items?.length ?? 0,
      withMultipleChains: (rec[0]?.items || []).filter((i: MCItem) => {
        const v = (i as any)._variants;
        return v && Array.isArray(v) && v.length > 1;
      }).length,
      recentTokens: recentTokenIds?.length || 0
    });
    return rec;
  }

  const result: MCItem[] = [];
  const controller = typeof AbortController !== "undefined" ? new AbortController() : undefined;

  // 2-4) Búsquedas en paralelo (catálogo local, Jupiter, CoinGecko)
  const [localResult, jupResult, cgResult] = await Promise.allSettled([
    // Catálogo local
    Promise.resolve(searchTokens(query, {
      recipientChains: allowChains?.map(k => KEY_TO_CHAIN_ID[k]).filter(Boolean) as string[] | undefined,
    limit: 60,
    })),
    
    // Jupiter (Solana)
    (async () => {
      if (allowChains && !allowChains.includes("solana")) return [];
      try {
        return await jupSearch(query, controller?.signal);
      } catch {
        return [];
      }
    })(),
    
    // CoinGecko (EVM chains)
    (async () => {
      const hasEvm = !allowChains || allowChains.some(c => ["ethereum", "base", "polygon"].includes(c));
      if (!hasEvm) return [];
      try {
        return await searchCoinGecko(query, controller?.signal);
      } catch {
        return [];
      }
    })(),
  ]);

  // Procesar resultados del catálogo local
  if (localResult.status === "fulfilled") {
    for (const hit of localResult.value) {
    for (const cid of hit.chains || []) {
      const ck = CHAIN_ID_TO_KEY[cid];
      if (!ck) continue;
      if (allowChains && !allowChains.includes(ck)) continue;

      const iconUrl: string | undefined = (hit as any).logoURI || undefined;
      
      // Intentar obtener marketCapRank desde el catálogo si está disponible
      const catalogToken = (TOKENS_CATALOG as any[])?.find((t: any) => t.id === hit.id);
      const marketCapRank = catalogToken?.marketCapRank || undefined;

      result.push({
        id: hit.id,
        chain: ck,
        symbol: hit.symbol?.toUpperCase() || hit.id.toUpperCase(),
        name: hit.name,
          decimals: undefined,
        brand: undefined,
        iconUrl,
        marketCapRank,
      });
    }
    }
  }

  // Procesar resultados de Jupiter (Solana)
  if (jupResult.status === "fulfilled" && Array.isArray(jupResult.value)) {
    dbg("jup hits", jupResult.value.length);
    for (const t of jupResult.value) {
      result.push({
        id: `SPL:${String(t.id || "")}`,
        chain: "solana",
        symbol: (t.symbol || "").toUpperCase(),
        name: t.name,
        decimals: t.decimals,
        iconUrl: t.icon,
        brand: t.isVerified ? "verified" : undefined,
      });
    }
  } else {
    dbg("jup error", jupResult.status === "rejected" ? String(jupResult.reason) : "no result");
  }

  // Procesar resultados de CoinGecko (EVM)
  if (cgResult.status === "fulfilled" && Array.isArray(cgResult.value)) {
    dbg("coingecko hits", cgResult.value.length, "tokens found");
    const cgItems = mapCoinGeckoToMCItems(cgResult.value, allowChains);
    dbg("coingecko mapped", cgItems.length, "items created from", cgResult.value.length, "tokens");
    result.push(...cgItems);
  } else {
    const errorMsg = cgResult.status === "rejected" ? String(cgResult.reason) : "no result";
    dbg("coingecko error", errorMsg);
  }

  // Si parece address/mint exacto, prioriza
  const looksAddr = isSolMint(query) || isHexAddr(query);
  if (looksAddr) {
    result.sort((a, b) => {
      const eqA = a.id.toLowerCase().includes(query.toLowerCase());
      const eqB = b.id.toLowerCase().includes(query.toLowerCase());
      return (eqA === eqB) ? 0 : eqA ? -1 : 1;
    });
  }

  // 5) Enriquecer EVM con metadata (Alchemy si está disponible)
  const needEvmMeta = result.filter(
    (r) => (r.chain === "ethereum" || r.chain === "base" || r.chain === "polygon") && !r.decimals
  );
  dbg("needEvmMeta", needEvmMeta.length);

  if (needEvmMeta.length) {
    try {
      const evmInputs: Array<{ chain: EvmChain; address: string }> = [];
      const evmIdxs: number[] = [];

      for (let i = 0; i < result.length; i++) {
        const it = result[i];
        if (!((it.chain === "ethereum" || it.chain === "base" || it.chain === "polygon") && !it.decimals)) continue;
        const evmChain = asEvmChain(it.chain);
        if (!evmChain) continue;

        let addr: string | undefined;

        // Para tokens de CoinGecko, extraer address del ID (formato: CG:coinId:chain:address)
        if (it.id.startsWith("CG:")) {
          const parts = it.id.split(":");
          // Si tiene address en el ID, usarlo directamente
          if (parts.length >= 4) {
            addr = parts[3];
          } else {
            // Si no, intentar obtenerlo desde CoinGecko
            const coinId = parts[1];
            try {
              addr = await getTokenAddressOnChain(coinId, evmChain, controller?.signal);
            } catch {
              continue;
            }
          }
        } else {
          // Para tokens del catálogo local
        const meta: any = (TOKENS_CATALOG as any[])?.find((t) => t.id === it.id);
        const cid = KEY_TO_CHAIN_ID[it.chain];
          addr = cid ? meta?.addresses?.[cid] : undefined;
        }

        if (!addr) continue;

        evmInputs.push({ chain: evmChain, address: String(addr).toLowerCase() });
        evmIdxs.push(i);
      }

      if (evmInputs.length) {
        const enriched = await enrichEvmTokens(evmInputs);
        for (let j = 0; j < enriched.length; j++) {
          const idx = evmIdxs[j];
          if (idx >= result.length) continue;
          const src = result[idx];
          const e: any = enriched[j] || {};
          result[idx] = {
            ...src,
            name: e.name ?? src.name,
            symbol: (e.symbol ?? src.symbol)?.toUpperCase?.() ?? src.symbol,
            decimals: typeof e.decimals === "number" ? e.decimals : src.decimals,
            iconUrl: e.iconUrl ?? src.iconUrl,
          } as MCItem;
        }
      }
    } catch (e) {
      dbg("alchemy enrich error", String((e as Error)?.message ?? e));
    }
  }

  // 6) Agrupar tokens por símbolo (un token = múltiples chains disponibles)
  const tokenGroups = new Map<string, {
    symbol: string;
    name: string;
    iconUrl?: string;
    brand?: string;
    variants: Array<{
      chain: ChainKey;
      id: string;
      decimals?: number;
      address?: string;
      reason?: MCItem["reason"];
    }>;
  }>();

  for (const it of result) {
    const symbolKey = it.symbol.toLowerCase();
    
    if (!tokenGroups.has(symbolKey)) {
      // Si no hay iconUrl, intentar resolverlo con la misma lógica que catalogToMCItems
      let iconUrlToUse = it.iconUrl;
      if (!iconUrlToUse) {
        const meta = (TOKENS_CATALOG as any[]).find((t: any) => 
          t.id === it.id || 
          t.id?.toLowerCase() === it.id?.toLowerCase() ||
          (t.symbol && t.symbol.toUpperCase() === it.symbol.toUpperCase())
        );
        
        if (meta) {
          // Para tokens de Solana, usar Jupiter primero
          if (it.chain === "solana") {
            const symbolLower = (meta.symbol || "").toLowerCase();
            const jupiterKnown: Record<string, string> = {
              "bonk": "DezXAZ8z7PnrnRJjz3wXBoRgixH6nWoQKrPjjkwyqS2P",
              "jup": "JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN",
              "wif": "EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm",
              "ray": "4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R",
              "orca": "orcaEKTdK7LKz57vaAYr9QeNsVcfz6ygEbGeQ3Pnj",
              "jto": "jtojtomepa8beP8AuQc6eXt5FriJwfFMwQx2v2f9mCL",
              "msol": "mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So",
              "jitosol": "J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGHPn",
            };
            
            if (symbolLower && jupiterKnown[symbolLower]) {
              iconUrlToUse = `https://assets.jup.ag/icons/${jupiterKnown[symbolLower]}.png`;
            }
          } else if (meta.logoURI && typeof meta.logoURI === "string") {
            // Para tokens NO-Solana, usar logoURI (CoinGecko)
            iconUrlToUse = meta.logoURI;
          }
        }
      }
      
      tokenGroups.set(symbolKey, {
        symbol: it.symbol,
        name: it.name || it.symbol,
        iconUrl: iconUrlToUse,
        brand: it.brand,
        variants: [{
          chain: it.chain,
          id: it.id,
          decimals: it.decimals,
          address: it.address,
          reason: it.reason,
        }],
      });
    } else {
      const group = tokenGroups.get(symbolKey)!;
      // Solo agregar si es una chain diferente
      const hasChain = group.variants.some(v => v.chain === it.chain);
      if (!hasChain) {
        group.variants.push({
          chain: it.chain,
          id: it.id,
          decimals: it.decimals,
          address: it.address,
          reason: it.reason,
        });
        // Actualizar metadata si es mejor
        if (!group.iconUrl && it.iconUrl) group.iconUrl = it.iconUrl;
        if (!group.brand && it.brand) group.brand = it.brand;
        if (!group.name && it.name) group.name = it.name;
      } else {
        // Si ya existe esta chain, mantener la mejor versión
        const existing = group.variants.find(v => v.chain === it.chain);
        if (existing) {
          const existingScore = (existing.decimals ? 10 : 0) + (existing.reason === undefined ? 5 : 0);
          const newScore = (it.decimals ? 10 : 0) + (it.reason === undefined ? 5 : 0);
          if (newScore > existingScore) {
            const idx = group.variants.indexOf(existing);
            group.variants[idx] = {
              chain: it.chain,
              id: it.id,
              decimals: it.decimals,
              address: it.address,
              reason: it.reason,
            };
          }
        }
      }
    }
  }
  
  dbg("tokenGroups after grouping", tokenGroups.size, Array.from(tokenGroups.values()).map(g => ({ symbol: g.symbol, variants: g.variants.length })));

  // Popularidad de chains (para cuando no hay preferencia específica)
  const chainPopularity: Record<ChainKey, number> = {
    solana: 100,
    base: 90,
    ethereum: 80,
    polygon: 70,
  };

  // Convertir grupos a items con auto-selección de chain
  const items: MCItem[] = [];
  for (const [symbolKey, group] of tokenGroups.entries()) {
    // Ordenar variants: preferredChain primero, luego por popularidad
    group.variants.sort((a, b) => {
      if (preferredChain) {
        if (a.chain === preferredChain) return -1;
        if (b.chain === preferredChain) return 1;
      }
      const aPop = chainPopularity[a.chain] || 0;
      const bPop = chainPopularity[b.chain] || 0;
      return bPop - aPop;
    });

    // Auto-seleccionar la mejor chain (primera después de ordenar)
    const bestVariant = group.variants[0];
    if (bestVariant) {
      items.push({
        id: bestVariant.id,
        chain: bestVariant.chain,
        symbol: group.symbol,
        name: group.name,
        decimals: bestVariant.decimals,
        brand: group.brand,
        iconUrl: group.iconUrl,
        reason: bestVariant.reason,
        address: bestVariant.address,
        // Metadata adicional: todas las chains disponibles y sus variants completas
        ...({
          _availableChains: group.variants.map(v => v.chain),
          _variants: group.variants, // Para poder acceder a todos los variants completos
        } as any),
      });
    }
  }

  // 6.5) Filtrar tokens que solo tienen la query en su descripción pero no en símbolo/nombre principal
  // Esto evita que aparezcan tokens como "USDCPO" cuando buscas "polygon" solo porque dicen "Portal from Polygon"
  const qLower = query.toLowerCase().trim();
  if (qLower.length > 0) {
    const filteredItems: MCItem[] = [];
    const nameMatches: MCItem[] = []; // Tokens que coinciden solo en nombre/descripción
    
    for (const item of items) {
      const symLower = item.symbol.toLowerCase();
      const nameLower = (item.name || "").toLowerCase();
      
      // Match en símbolo (siempre incluir)
      const symbolMatch = symLower === qLower || symLower.startsWith(qLower) || symLower.includes(qLower);
      
      // Match en nombre principal - pero excluir si solo aparece en frases como "from Polygon", "on Polygon", "Portal from Polygon"
      // Estas frases indican que el token está "en Polygon" pero no ES Polygon
      let nameMatch = false;
      if (nameLower) {
        // Si el nombre completo coincide exactamente o empieza con la query, incluirlo
        if (nameLower === qLower || nameLower.startsWith(qLower + " ")) {
          nameMatch = true;
        } else if (nameLower.includes(qLower)) {
          // Si contiene la query, verificar que no sea solo en frases como "from X", "on X", "Portal from X"
          const patternsToExclude = [
            `from ${qLower}`,
            `on ${qLower}`,
            `portal from ${qLower}`,
            `allbridge from ${qLower}`,
            `wrapped.*from ${qLower}`,
            `\\(.*from ${qLower}\\)`,
          ];
          const isInExcludedPattern = patternsToExclude.some(pattern => {
            const regex = new RegExp(pattern, "i");
            return regex.test(nameLower);
          });
          // Solo incluir si NO está en un patrón excluido
          if (!isInExcludedPattern) {
            nameMatch = true;
          }
        }
      }
      
      // Si coincide en símbolo o nombre principal válido, incluirlo
      if (symbolMatch || nameMatch) {
        if (symbolMatch) {
          filteredItems.push(item); // Prioridad: símbolo primero
        } else {
          nameMatches.push(item); // Después: nombre
        }
      }
      // Si no coincide en símbolo ni nombre válido, NO incluirlo
    }
    
    // Combinar: primero símbolos, luego nombres
    const originalCount = items.length;
    items = [...filteredItems, ...nameMatches];
    dbg("filtered items", items.length, "from", originalCount, "original items");
  }

  // 7) Ranking mejorado con prioridad de tokens oficiales (top 100)
  items.sort((a, b) => {
    const aSym = a.symbol.toLowerCase();
    const bSym = b.symbol.toLowerCase();
    const qLower = query.toLowerCase();
    
    // Prioridad 0: Match exacto en símbolo (máxima prioridad absoluta)
    const aExactSymbol = aSym === qLower;
    const bExactSymbol = bSym === qLower;
    if (aExactSymbol && !bExactSymbol) return -1;
    if (!aExactSymbol && bExactSymbol) return 1;
    
    // Prioridad 0.5: Match exacto en nombre
    const aExactName = a.name?.toLowerCase() === qLower;
    const bExactName = b.name?.toLowerCase() === qLower;
    if (aExactName && !bExactName) return -1;
    if (!aExactName && bExactName) return 1;
    
    // Prioridad 1: Tokens oficiales del top 100 (máxima prioridad)
    const aIsTop100 = a.marketCapRank !== undefined && a.marketCapRank <= 100;
    const bIsTop100 = b.marketCapRank !== undefined && b.marketCapRank <= 100;
    if (aIsTop100 && !bIsTop100) return -1;
    if (!aIsTop100 && bIsTop100) return 1;
    // Si ambos son top 100, ordenar por rank (menor = mejor)
    if (aIsTop100 && bIsTop100 && a.marketCapRank !== undefined && b.marketCapRank !== undefined) {
      if (a.marketCapRank !== b.marketCapRank) return a.marketCapRank - b.marketCapRank;
    }
    
    // Prioridad 2: Match exacto + chain preferida (combinación más fuerte)
    const aExactPreferred = (aSym === qLower || a.name?.toLowerCase() === qLower) && preferredChain && a.chain === preferredChain;
    const bExactPreferred = (bSym === qLower || b.name?.toLowerCase() === qLower) && preferredChain && b.chain === preferredChain;
    if (aExactPreferred && !bExactPreferred) return -1;
    if (!aExactPreferred && bExactPreferred) return 1;

    // Prioridad 3: Chain preferida (aunque no sea match exacto)
    if (preferredChain) {
      if (a.chain === preferredChain && b.chain !== preferredChain) return -1;
      if (a.chain !== preferredChain && b.chain === preferredChain) return 1;
    }

    // Prioridad 4: Verified/brand tokens
    if (a.brand && !b.brand) return -1;
    if (!a.brand && b.brand) return 1;

    // Prioridad 5: Empieza con query en símbolo
    const aSymStart = aSym.startsWith(qLower);
    const bSymStart = bSym.startsWith(qLower);
    if (aSymStart && !bSymStart) return -1;
    if (!aSymStart && bSymStart) return 1;

    // Prioridad 6: Tiene metadata completa
    const aComplete = a.decimals && a.name && a.iconUrl;
    const bComplete = b.decimals && b.name && b.iconUrl;
    if (aComplete && !bComplete) return -1;
    if (!aComplete && bComplete) return 1;

    // Prioridad 7: Popularidad de chain (si no hay preferencia)
    if (!preferredChain) {
      const aPop = chainPopularity[a.chain] || 0;
      const bPop = chainPopularity[b.chain] || 0;
      if (aPop !== bPop) return bPop - aPop;
    }

    // Prioridad 8: Orden alfabético
    return a.symbol.localeCompare(b.symbol);
  });

  dbg("final items", items.length);

  if (!items.length) return [{ key: "all", title: "Results", items: [] }];
  
  // Separar tokens oficiales (top 100) de otros tokens
  const officialTokens: MCItem[] = [];
  const otherTokens: MCItem[] = [];
  
  for (const item of items) {
    const isOfficial = item.marketCapRank !== undefined && item.marketCapRank <= 100;
    if (isOfficial) {
      officialTokens.push(item);
    } else {
      otherTokens.push(item);
    }
  }
  
  // Si hay tokens oficiales, crear grupos separados
  if (officialTokens.length > 0) {
    const groups: MCGroup[] = [
      { key: "official", title: "Official", items: officialTokens },
    ];
    
    // Si hay otros tokens, agregarlos como segundo grupo (limitado a 10 para mostrar "View more")
    if (otherTokens.length > 0) {
      groups.push({
        key: "other",
        title: "Other tokens",
        items: otherTokens.slice(0, 10), // Mostrar solo primeros 10, el resto se mostrará con "View more"
      });
    }
    
    return groups;
  }
  
  // Si no hay tokens oficiales, devolver todos como un solo grupo
  return [{ key: "all", title: "Results", items }];
}