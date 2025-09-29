// src/lib/token-catalog.ts
import featuredSolanaRaw from "../../assets/tokens/token-list/featured.json";// <- tu fichero existente

export type ChainKey = 'solana' | 'ethereum' | 'base' | 'polygon';
export type TokenCatalogItem = {
  chain: ChainKey;
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  logoURI?: string;
};

type FeaturedSolanaItem = {
  // admitimos ambas llaves
  mint?: string;
  address?: string;
  symbol?: string;
  name?: string;
  decimals?: number;
  logoURI?: string;
};

const JUP_TOKENS = 'https://tokens.jup.ag/tokens';
const UNI_LISTS = {
  ethereum: 'https://tokens.uniswap.org',
  base: 'https://raw.githubusercontent.com/Uniswap/default-token-list/main/src/tokens/base.json',
  polygon: 'https://raw.githubusercontent.com/Uniswap/default-token-list/main/src/tokens/polygon.json',
} as const;

let solanaCache: TokenCatalogItem[] | null = null;
let evmCache: Partial<Record<'ethereum' | 'base' | 'polygon', TokenCatalogItem[]>> = {};

function toFeaturedArray(raw: unknown): FeaturedSolanaItem[] {
  return Array.isArray(raw) ? (raw as FeaturedSolanaItem[]) : [];
}

export async function getSolanaCatalog(): Promise<TokenCatalogItem[]> {
  if (solanaCache) return solanaCache;

  const resp = await fetch(JUP_TOKENS);
  if (!resp.ok) throw new Error(`Jupiter tokens error: ${resp.status}`);
  const jup = (await resp.json()) as any[];

  const list: TokenCatalogItem[] = jup
    .filter(t => t.chainId === 101)
    .map(t => ({
      chain: 'solana' as const,
      address: t.address,
      symbol: t.symbol,
      name: t.name,
      decimals: t.decimals,
      logoURI: t.logoURI,
    }));

  const byAddr = new Map(list.map(x => [x.address, x]));
  const featuredSolana = toFeaturedArray(featuredSolanaRaw);

  const enrichedFeatured: TokenCatalogItem[] = featuredSolana
    .map(f => {
      const mint = f.mint ?? f.address; // admitimos cualquiera
      if (!mint) return null;
      const hit = byAddr.get(mint);
      return {
        chain: 'solana' as const,
        address: mint,
        symbol: hit?.symbol ?? f.symbol ?? 'UNKNOWN',
        name: hit?.name ?? f.name ?? f.symbol ?? 'Unknown',
        decimals: hit?.decimals ?? f.decimals ?? 9,
        logoURI: hit?.logoURI ?? f.logoURI,
      } as TokenCatalogItem;
    })
    .filter(Boolean) as TokenCatalogItem[];

  const featuredSet = new Set(enrichedFeatured.map(t => t.address));
  solanaCache = [
    ...enrichedFeatured,
    ...list.filter(t => !featuredSet.has(t.address)),
  ];
  return solanaCache!;
}

async function getEvmCatalog(chain: 'ethereum' | 'base' | 'polygon'): Promise<TokenCatalogItem[]> {
  if (evmCache[chain]) return evmCache[chain]!;
  const url = UNI_LISTS[chain];
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`Uniswap list ${chain} error: ${resp.status}`);
  const data = await resp.json();

  const tokens = (data.tokens ?? data)?.map((t: any) => ({
    chain,
    address: t.address,
    symbol: t.symbol,
    name: t.name,
    decimals: t.decimals,
    logoURI: t.logoURI,
  })) as TokenCatalogItem[];

  evmCache[chain] = tokens;
  return tokens;
}

function score(q: string, t: TokenCatalogItem): number {
  const s = `${t.symbol} ${t.name} ${t.address}`.toLowerCase();
  const qi = q.toLowerCase().trim();
  if (!qi) return 0;
  let sc = 0;
  if (t.symbol.toLowerCase() === qi) sc += 5;
  if (t.name.toLowerCase().startsWith(qi)) sc += 3;
  if (s.includes(qi)) sc += 1;
  return sc;
}

export async function searchTokens(
  chain: ChainKey,
  query: string,
  limit = 50
): Promise<TokenCatalogItem[]> {
  const list = chain === 'solana'
    ? await getSolanaCatalog()
    : await getEvmCatalog(chain as Exclude<ChainKey, 'solana'>);

  if (!query) return list.slice(0, limit);

  return list
    .map(t => ({ t, sc: score(query, t) }))
    .filter(x => x.sc > 0)
    .sort((a, b) => b.sc - a.sc)
    .slice(0, limit)
    .map(x => x.t);
}