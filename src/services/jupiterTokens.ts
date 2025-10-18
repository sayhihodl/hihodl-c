// src/services/jupiterTokens.ts
// Fetch seguro con timeout + caché en memoria para búsquedas de tokens Solana via Jupiter v2.

type JupToken = {
  address: string;          // mint
  name: string;
  symbol: string;
  decimals: number;
  logoURI?: string;
  extensions?: { coingeckoId?: string };
};

export type JupSearchItem = {
  id: string;               // usamos el mint como id "SPL:<mint>"
  symbol: string;
  name: string;
  decimals: number;
  chains: string[];         // ["solana:mainnet"]
  addresses: Array<{ chainId: string; addr: string }>;
  logoURI?: string;
  coingeckoId?: string;
  priority: number;         // para rankeo
};

const SOLANA_CHAIN_ID = "solana:mainnet";

// ⚠️ ENDPOINT A CONFIRMAR SEGÚN V2 (doc de Jupiter). Deja en constantes para cambiar rápido.
const JUP_BASE = "https://tokens.jup.ag";
const JUP_SEARCH_PATH = "/token/v2/search"; // <-- ajusta si tu doc marca otra ruta (p.e. /v2?query=)
const JUP_BY_MINT_PATH = "/token/v2/mints"; // <-- para lookup por mint (si lo usas)

// caché trivial en memoria
const cache = new Map<string, JupSearchItem[]>();

function withTimeout<T>(p: Promise<T>, ms = 6000): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error("timeout")), ms);
    p.then((v) => { clearTimeout(t); resolve(v); })
     .catch((e) => { clearTimeout(t); reject(e); });
  });
}

export async function searchJupiterTokens(query: string, limit = 25): Promise<JupSearchItem[]> {
  const q = query.trim();
  if (!q) return [];
  const key = `q:${q}|l:${limit}`;
  const cached = cache.get(key);
  if (cached) return cached;

  // Construye URL (sin suponer params raros)
  const url = `${JUP_BASE}${JUP_SEARCH_PATH}?query=${encodeURIComponent(q)}&limit=${limit}`;

  try {
    const res = await withTimeout(fetch(url), 7000);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json() as { tokens?: JupToken[] } | JupToken[];

    const list: JupToken[] = Array.isArray(data)
      ? data
      : (data?.tokens ?? []);

    const mapped: JupSearchItem[] = list.map((t): JupSearchItem => ({
      id: `SPL:${t.address}`,                 // ID estable para StepToken & buscador
      symbol: t.symbol || t.address.slice(0, 4),
      name: t.name || t.symbol || t.address,
      decimals: typeof t.decimals === "number" ? t.decimals : 9,
      chains: [SOLANA_CHAIN_ID],
      addresses: [{ chainId: SOLANA_CHAIN_ID, addr: t.address }],
      logoURI: t.logoURI,
      coingeckoId: t.extensions?.coingeckoId,
      priority: 65,                            // por debajo de stables pero visible
    }));

    cache.set(key, mapped);
    return mapped;
  } catch {
    // silencioso: si falla, devolvemos vacío (UI seguirá con catálogo local)
    return [];
  }
}

// Opcional: lookup directo por mint (útil si el usuario pega un mint)
export async function fetchJupiterByMint(mint: string): Promise<JupSearchItem | undefined> {
  const m = mint.trim();
  if (!m) return;
  try {
    const url = `${JUP_BASE}${JUP_BY_MINT_PATH}?mints=${encodeURIComponent(m)}`;
    const res = await withTimeout(fetch(url), 7000);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json() as { tokens?: JupToken[] } | JupToken[];
    const tok: JupToken | undefined = Array.isArray(data) ? data[0] : (data?.tokens?.[0]);
    if (!tok) return;
    return {
      id: `SPL:${tok.address}`,
      symbol: tok.symbol || tok.address.slice(0, 4),
      name: tok.name || tok.symbol || tok.address,
      decimals: typeof tok.decimals === "number" ? tok.decimals : 9,
      chains: [SOLANA_CHAIN_ID],
      addresses: [{ chainId: SOLANA_CHAIN_ID, addr: tok.address }],
      logoURI: tok.logoURI,
      coingeckoId: tok.extensions?.coingeckoId,
      priority: 70,
    };
  } catch {
    return;
  }
}