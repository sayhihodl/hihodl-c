// src/services/multichainSearch.ts
import { searchTokens } from "@/search/tokensIndex";
import { TOKENS_CATALOG } from "@/config/tokensCatalog";
import { jupSearch } from "@/services/jupiter";
import { enrichEvmTokens } from "@/services/alchemy"; // opcional, si no hay KEY seguirá funcionando
import type { ChainKey } from "@/send/types";

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
};

export type MCGroup = { key: string; title: string; items: MCItem[] };

/** ===== debug helper ===== */
const dbg = (...x: any[]) => { try { console.debug("[mcs]", ...x); } catch {} };

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

      out.push({
        id: t.id,
        chain: ck,
        symbol: String(t.symbol || t.id || "").toUpperCase(),
        name: t.name,
        decimals: typeof t.decimals === "number" ? t.decimals : undefined,
        brand: t.brand,
        iconUrl: (t.logoURI as string | undefined) || undefined,
      });
    }
  }
  // de-dup por (id,chain)
  const uniq = new Map(out.map(i => [`${i.id}-${i.chain}`, i]));
  return Array.from(uniq.values());
}

/** Recommended robusto con fallback estático */
function recommended(allowChains?: ChainKey[]): MCGroup[] {
  let items = catalogToMCItems(allowChains);
  if (!items.length) {
    const set = allowChains ? new Set(allowChains) : undefined;
    items = STATIC_RECS.filter(i => !set || set.has(i.chain));
    dbg("recommended from STATIC_RECS", items.length);
  }

  const order = ["USDC", "USDT", "ETH", "SOL", "WBTC", "WETH"];
  items.sort((a, b) => {
    const ia = order.indexOf(a.symbol);
    const ib = order.indexOf(b.symbol);
    if (ia !== -1 || ib !== -1) return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
    return a.symbol.localeCompare(b.symbol);
  });

  return [{ key: "rec", title: "Recommended", items: items.slice(0, 50) }];
}

/** ===== Búsqueda federada ===== */
export async function multichainSearch(q: string, allowChains?: ChainKey[]): Promise<MCGroup[]> {
  const query = (q || "").trim();

  // 1) Sin query → Recommended
  if (!query) {
    const rec = recommended(allowChains);
    dbg("recommended", { allowChains, count: rec[0]?.items?.length ?? 0 });
    return rec;
  }

  const result: MCItem[] = [];

  // 2) Catálogo local (multi-chain)
  const recipientChains = allowChains?.map(k => KEY_TO_CHAIN_ID[k]);
  const local = searchTokens(query, {
    recipientChains: (recipientChains?.filter(Boolean) as string[] | undefined),
    limit: 60,
  });
  dbg("local hits", local.length);

  for (const hit of local) {
    for (const cid of hit.chains || []) {
      const ck = CHAIN_ID_TO_KEY[cid];
      if (!ck) continue;
      if (allowChains && !allowChains.includes(ck)) continue;

      const iconUrl: string | undefined = (hit as any).logoURI || undefined;

      result.push({
        id: hit.id,
        chain: ck,
        symbol: hit.symbol?.toUpperCase() || hit.id.toUpperCase(),
        name: hit.name,
        decimals: undefined, // se resuelve en pick/enrichment
        brand: undefined,
        iconUrl,
      });
    }
  }

  // 3) Jupiter (Solana) — no requiere API key
  try {
    const jup = await jupSearch(query);
    dbg("jup hits", Array.isArray(jup) ? jup.length : 0);
    for (const t of jup) {
      if (allowChains && !allowChains.includes("solana")) continue;
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
  } catch (e) {
    dbg("jup error", String((e as Error)?.message ?? e));
  }

  // 4) Si parece address/mint exacto, prioriza
  const looksAddr = isSolMint(query) || isHexAddr(query);
  if (looksAddr) {
    result.sort((a, b) => {
      const eqA = a.id.toLowerCase().includes(query.toLowerCase());
      const eqB = b.id.toLowerCase().includes(query.toLowerCase());
      return (eqA === eqB) ? 0 : eqA ? -1 : 1;
    });
  }

  // 5) Enriquecer EVM (opcional)
  const needEvmMeta = result.filter(
    (r) => (r.chain === "ethereum" || r.chain === "base" || r.chain === "polygon") && !r.decimals
  );
  dbg("needEvmMeta", needEvmMeta.length);

  if (needEvmMeta.length) {
    try {
      // Recolecta entradas a enriquecer + sus índices en `result`
      const evmInputs: Array<{ chain: EvmChain; address: string } > = [];
      const evmIdxs: number[] = [];

      for (let i = 0; i < result.length; i++) {
        const it = result[i];
        if (!((it.chain === "ethereum" || it.chain === "base" || it.chain === "polygon") && !it.decimals)) continue;
        const evmChain = asEvmChain(it.chain);
        if (!evmChain) continue;

        const meta: any = (TOKENS_CATALOG as any[])?.find((t) => t.id === it.id);
        const cid = KEY_TO_CHAIN_ID[it.chain];
        const addr: string | undefined = cid ? meta?.addresses?.[cid] : undefined;
        if (!addr) continue;

        evmInputs.push({ chain: evmChain, address: String(addr).toLowerCase() });
        evmIdxs.push(i);
      }

      if (evmInputs.length) {
        const enriched = await enrichEvmTokens(evmInputs as any);
        for (let j = 0; j < enriched.length; j++) {
          const idx = evmIdxs[j];
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

  // 6) De-dup por (id,chain)
  const uniq = new Map<string, MCItem>();
  for (const it of result) {
    const k = `${it.id}-${it.chain}`;
    if (!uniq.has(k)) uniq.set(k, it);
  }

  const items = Array.from(uniq.values());
  dbg("final items", items.length);

  if (!items.length) return [{ key: "all", title: "Results", items: [] }];
  return [{ key: "all", title: "Results", items }];
}