// src/search/tokensIndex.ts
import { TOKENS_CATALOG } from "@/config/tokensCatalog";
import { normalizeText } from "./utils";

export type TokenIndexItem = {
  id: string;
  symbol: string;
  name: string;
  aliases: string[];
  chains: string[]; // ChainId[]
  addresses: Array<{ chainId: string; addr: string }>;
  priority: number; // 0..100
};

let IDX: TokenIndexItem[] = [];
let BUILT = false;

/** Calcula similitud simple (Levenshtein aproximado para palabras) */
function similarity(a: string, b: string): number {
  if (!a || !b) return 0;
  const na = a.toLowerCase();
  const nb = b.toLowerCase();
  if (na === nb) return 1;
  if (na.includes(nb) || nb.includes(na)) return 0.8;
  
  // Distancia de caracteres comunes
  let matches = 0;
  const minLen = Math.min(na.length, nb.length);
  for (let i = 0; i < minLen; i++) {
    if (na[i] === nb[i]) matches++;
  }
  return matches / Math.max(na.length, nb.length);
}

/** Scoring de relevancia para un token */
function scoreToken(item: TokenIndexItem, needle: string): number {
  const normNeedle = normalizeText(needle);
  let score = 0;

  // 1. Match exacto en symbol (máxima prioridad)
  const normSymbol = normalizeText(item.symbol);
  if (normSymbol === normNeedle) score += 1000;
  else if (normSymbol.startsWith(normNeedle)) score += 500;
  else if (normSymbol.includes(normNeedle)) score += 200;

  // 2. Match en name
  const normName = normalizeText(item.name || "");
  if (normName === normNeedle) score += 800;
  else if (normName.startsWith(normNeedle)) score += 400;
  else if (normName.includes(normNeedle)) score += 150;

  // 3. Match en aliases
  for (const alias of item.aliases) {
    const normAlias = normalizeText(alias);
    if (normAlias === normNeedle) score += 600;
    else if (normAlias.startsWith(normNeedle)) score += 300;
    else if (normAlias.includes(normNeedle)) score += 100;
  }

  // 4. Match en addresses (solo si parece ser una dirección)
  const isAddress = /^0x[a-f0-9]+$|^[1-9A-HJ-NP-Za-km-z]{32,}$/i.test(needle);
  if (isAddress) {
    for (const addr of item.addresses) {
      if (normalizeText(addr.addr).includes(normNeedle)) {
        score += 900; // Alta prioridad para addresses exactos
        break;
      }
    }
  }

  // 5. Fuzzy matching (si no hay match directo)
  if (score === 0) {
    const symSim = similarity(normSymbol, normNeedle);
    const nameSim = similarity(normName, normNeedle);
    score = Math.max(symSim, nameSim) * 50;
  }

  // 6. Boost por priority
  score += item.priority * 0.1;

  // 7. Boost si está en más chains (más popular)
  score += item.chains.length * 5;

  return score;
}

export function buildTokenSearchIndex(source = TOKENS_CATALOG) {
  IDX = source.map((t: any) => {
    const aliases: string[] = Array.from(
      new Set([t.symbol, t.name, ...(t.aliases ?? [])].filter(Boolean))
    );

    // Hotfix de alias conocidos
    const sym = String(t.symbol || "").toLowerCase();
    if (sym === "jup" && !aliases.some(a => String(a).toLowerCase() === "jupiter")) {
      aliases.push("Jupiter");
    }

    const addressesObj = t.addresses ?? {};
    const addresses = Object.entries(addressesObj).map(([chainId, addr]) => ({
      chainId,
      addr: String(addr),
    }));

    return {
      id: t.id,
      symbol: t.symbol,
      name: t.name,
      aliases,
      chains: t.supportedChains,
      addresses,
      priority: t.priority ?? 50,
    };
  });
  BUILT = true;
}

function ensureBuilt() {
  if (!BUILT) buildTokenSearchIndex();
}

export function searchTokens(q: string, opts?: { recipientChains?: string[]; limit?: number }) {
  ensureBuilt();

  const needle = normalizeText(q);
  const limit = opts?.limit ?? 100; // Aumentado para mejor ranking
  const allowChains = opts?.recipientChains?.length ? new Set(opts.recipientChains) : undefined;

  // Si no hay query, devuelve todos (filtrados por chains si aplica)
  if (!needle) {
    const all = IDX.filter((it) => {
    if (allowChains && !it.chains.some((c) => allowChains.has(c))) return false;
      return true;
    });
    return all.slice(0, limit);
  }

  // Filtra y puntúa
  const scored: Array<{ item: TokenIndexItem; score: number }> = [];
  
  for (const item of IDX) {
    if (allowChains && !item.chains.some((c) => allowChains.has(c))) continue;

    // Match básico: incluye needle o palabras que empiezan con needle
    const hay = [
      item.symbol,
      item.name,
      ...item.aliases,
      ...item.addresses.map((a) => a.addr),
    ].map(normalizeText).join(" | ");

    const hasMatch = hay.includes(needle) || 
      hay.split(/\s|\|/g).filter(Boolean).some((w) => w.startsWith(needle));

    if (hasMatch || similarity(normalizeText(item.symbol), needle) > 0.3) {
      const score = scoreToken(item, needle);
      if (score > 0) {
        scored.push({ item, score });
      }
    }
  }

  // Ordena por score descendente
  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, limit).map(({ item }) => item);
}