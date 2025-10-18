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
  const limit = opts?.limit ?? 50;
  const allowChains = opts?.recipientChains?.length ? new Set(opts.recipientChains) : undefined;

  const hits = IDX.filter((it) => {
    if (allowChains && !it.chains.some((c) => allowChains.has(c))) return false;
    if (!needle) return true;

    const hay = [
      it.symbol,
      it.name,
      ...it.aliases,
      ...it.addresses.map((a) => a.addr),
    ].map(normalizeText).join(" | ");

    // Fuzzy match mejorado
    if (hay.includes(needle)) return true;
    const words = hay.split(/\s|\|/g).filter(Boolean);
    return words.some((w) => w.startsWith(needle));
  });

  // ranking…
  hits.sort((a, b) => {
    const na = normalizeText(a.symbol);
    const nb = normalizeText(b.symbol);
    const exactA = na === needle ? 0 : 1;
    const exactB = nb === needle ? 0 : 1;
    if (exactA !== exactB) return exactA - exactB;

    const prefA = na.startsWith(needle) ? 0 : 1;
    const prefB = nb.startsWith(needle) ? 0 : 1;
    if (prefA !== prefB) return prefA - prefB;

    if (b.priority !== a.priority) return b.priority - a.priority;
    return a.symbol.localeCompare(b.symbol);
  });

  return hits.slice(0, limit);
}