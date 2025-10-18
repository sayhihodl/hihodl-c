// src/config/tokensCatalog.ts
import type { ChainId, CurrencyId } from "@/store/portfolio.store";

/* ===========================================================
   ================   TYPES & CONSTANTS   ====================
   =========================================================== */

export type TokenMeta = {
  id: CurrencyId;
  symbol: string;
  name: string;
  decimals: number;
  logo?: any;

  nativeChainId: ChainId;      // cadena “de origen”
  supportedChains: ChainId[];  // TODAS las cadenas donde está disponible
  isNative?: boolean;          // marca opcional para nativos “puros”
  coingeckoId?: string;        // opcional, para fetch de precio o logo
  priority?: number;           // para ordenamiento (ranking UI)

  // opcionales (para buscador enriquecido)
  aliases?: string[];
  addresses?: Record<ChainId, string>;
};

/** Mapa para convertir ChainKey (app) → ChainId (multichain format) */
export const CHAIN_ID_BY_KEY: Record<string, ChainId> = {
  ethereum: "eip155:1" as ChainId,
  base: "eip155:8453" as ChainId,
  polygon: "eip155:137" as ChainId,
  solana: "solana:mainnet" as ChainId,
};

/** Redes soportadas por el MVP */
export const APP_SUPPORTED_CHAIN_IDS: ChainId[] = [
  "eip155:1",        // Ethereum
  "eip155:8453",     // Base
  "eip155:137",      // Polygon
  "solana:mainnet",  // Solana
];

/* ===========================================================
   ==================   TOKEN CATALOG   =======================
   =========================================================== */

export const TOKENS_CATALOG: TokenMeta[] = [
  // ===== Principales / Stables =====
  {
    id: "USDC.circle" as CurrencyId,
    symbol: "USDC",
    name: "USD Coin",
    decimals: 6,
    nativeChainId: "eip155:1" as ChainId,
    supportedChains: ["eip155:1", "solana:mainnet", "eip155:8453", "eip155:137"],
    coingeckoId: "usd-coin",
    priority: 100,
    aliases: ["usdc", "usd coin", "circle_usdc"],
    // addresses opcionales si quieres filtrar por contract/mint en el buscador:
    // addresses: {
    //   "eip155:1": "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    //   "eip155:8453": "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913",
    //   "eip155:137": "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
    // },
  },
  {
    id: "USDT.tether" as CurrencyId,
    symbol: "USDT",
    name: "Tether USD",
    decimals: 6,
    nativeChainId: "eip155:1" as ChainId,
    supportedChains: ["eip155:1", "solana:mainnet", "eip155:8453", "eip155:137"],
    coingeckoId: "tether",
    priority: 95,
    aliases: ["usdt", "tether"],
  },

  // ===== Nativos =====
  {
    id: "ETH.native" as CurrencyId,
    symbol: "ETH",
    name: "Ethereum",
    decimals: 18,
    nativeChainId: "eip155:1" as ChainId,
    supportedChains: ["eip155:1"],
    coingeckoId: "ethereum",
    isNative: true,
    priority: 90,
    aliases: ["eth", "ethereum"],
  },
  {
    id: "SOL.native" as CurrencyId,
    symbol: "SOL",
    name: "Solana",
    decimals: 9,
    nativeChainId: "solana:mainnet" as ChainId,
    supportedChains: ["solana:mainnet"],
    coingeckoId: "solana",
    isNative: true,
    priority: 90,
    aliases: ["sol", "solana"],
  },

  // ===== Solana (populares) =====
  {
    id: "BONK.token" as CurrencyId,
    symbol: "BONK",
    name: "Bonk",
    decimals: 5,
    nativeChainId: "solana:mainnet" as ChainId,
    supportedChains: ["solana:mainnet"],
    coingeckoId: "bonk",
    priority: 85,
    aliases: ["bonk", "bonk token"],
  },
  {
    id: "JUP.token" as CurrencyId,
    symbol: "JUP",
    name: "Jupiter",
    decimals: 6,
    nativeChainId: "solana:mainnet" as ChainId,
    supportedChains: ["solana:mainnet"],
    coingeckoId: "jupiter",
    priority: 80,
    aliases: ["jup", "jupiter"],
  },
  {
    id: "RAY.token" as CurrencyId,
    symbol: "RAY",
    name: "Raydium",
    decimals: 6,
    nativeChainId: "solana:mainnet" as ChainId,
    supportedChains: ["solana:mainnet"],
    coingeckoId: "raydium",
    priority: 78,
    aliases: ["ray", "raydium"],
  },
  {
    id: "ORCA.token" as CurrencyId,
    symbol: "ORCA",
    name: "Orca",
    decimals: 6,
    nativeChainId: "solana:mainnet" as ChainId,
    supportedChains: ["solana:mainnet"],
    coingeckoId: "orca",
    priority: 70,
    aliases: ["orca"],
  },
  {
    id: "JTO.token" as CurrencyId,
    symbol: "JTO",
    name: "Jito",
    decimals: 6,
    nativeChainId: "solana:mainnet" as ChainId,
    supportedChains: ["solana:mainnet"],
    coingeckoId: "jito-governance-token",
    priority: 72,
    aliases: ["jito", "jto"],
  },
  {
    id: "WIF.token" as CurrencyId,
    symbol: "WIF",
    name: "dogwifhat",
    decimals: 6,
    nativeChainId: "solana:mainnet" as ChainId,
    supportedChains: ["solana:mainnet"],
    coingeckoId: "dogwifcoin",
    priority: 75,
    aliases: ["wif", "dogwifhat"],
  },
  {
    id: "PYTH.token" as CurrencyId,
    symbol: "PYTH",
    name: "Pyth Network",
    decimals: 6,
    nativeChainId: "solana:mainnet" as ChainId,
    supportedChains: ["solana:mainnet"],
    coingeckoId: "pyth-network",
    priority: 74,
    aliases: ["pyth"],
  },
  {
    id: "MSOL.token" as CurrencyId,
    symbol: "MSOL",
    name: "Marinade staked SOL",
    decimals: 9,
    nativeChainId: "solana:mainnet" as ChainId,
    supportedChains: ["solana:mainnet"],
    coingeckoId: "marinade-staked-sol",
    priority: 76,
    aliases: ["marinade", "msoL", "staked sol"],
  },
  {
    id: "JITOSOL.token" as CurrencyId,
    symbol: "JITOSOL",
    name: "Jito Staked SOL",
    decimals: 9,
    nativeChainId: "solana:mainnet" as ChainId,
    supportedChains: ["solana:mainnet"],
    coingeckoId: "jito-staked-sol",
    priority: 70,
    aliases: ["jito sol", "jitosol", "stsol jito"],
  },
  {
    id: "WEN.token" as CurrencyId,
    symbol: "WEN",
    name: "WEN",
    decimals: 5,
    nativeChainId: "solana:mainnet" as ChainId,
    supportedChains: ["solana:mainnet"],
    coingeckoId: "wen",
    priority: 60,
    aliases: ["wen"],
  },

  // ===== ETH / Base / Polygon (clásicos) =====
  {
    id: "DAI.native" as CurrencyId,
    symbol: "DAI",
    name: "Dai Stablecoin",
    decimals: 18,
    nativeChainId: "eip155:1" as ChainId,
    supportedChains: ["eip155:1", "eip155:8453", "eip155:137"],
    coingeckoId: "dai",
    priority: 80,
    aliases: ["dai"],
  },
  {
    id: "WBTC.native" as CurrencyId,
    symbol: "WBTC",
    name: "Wrapped Bitcoin",
    decimals: 8,
    nativeChainId: "eip155:1" as ChainId,
    supportedChains: ["eip155:1", "eip155:137"],
    coingeckoId: "wrapped-bitcoin",
    priority: 78,
    aliases: ["wbtc", "wrapped btc"],
  },
  {
    id: "LDO.native" as CurrencyId,
    symbol: "LDO",
    name: "Lido DAO",
    decimals: 18,
    nativeChainId: "eip155:1" as ChainId,
    supportedChains: ["eip155:1"],
    coingeckoId: "lido-dao",
    priority: 70,
    aliases: ["lido"],
  },
  {
    id: "LINK.native" as CurrencyId,
    symbol: "LINK",
    name: "Chainlink",
    decimals: 18,
    nativeChainId: "eip155:1" as ChainId,
    supportedChains: ["eip155:1", "eip155:137"],
    coingeckoId: "chainlink",
    priority: 75,
    aliases: ["link"],
  },
  {
    id: "UNI.native" as CurrencyId,
    symbol: "UNI",
    name: "Uniswap",
    decimals: 18,
    nativeChainId: "eip155:1" as ChainId,
    supportedChains: ["eip155:1", "eip155:137"],
    coingeckoId: "uniswap",
    priority: 72,
    aliases: ["uni"],
  },
  {
    id: "AAVE.native" as CurrencyId,
    symbol: "AAVE",
    name: "Aave",
    decimals: 18,
    nativeChainId: "eip155:1" as ChainId,
    supportedChains: ["eip155:1"],
    coingeckoId: "aave",
    priority: 68,
    aliases: ["aave"],
  },

  // ===== Base (memes/infra del ecosistema) =====
  {
    id: "DEGEN.base" as CurrencyId,
    symbol: "DEGEN",
    name: "Degen (Base)",
    decimals: 18,
    nativeChainId: "eip155:8453" as ChainId,
    supportedChains: ["eip155:8453"],
    coingeckoId: "degen-base",
    priority: 65,
    aliases: ["degen"],
  },
  {
    id: "BRETT.base" as CurrencyId,
    symbol: "BRETT",
    name: "Brett (Base)",
    decimals: 18,
    nativeChainId: "eip155:8453" as ChainId,
    supportedChains: ["eip155:8453"],
    coingeckoId: "based-brett",
    priority: 60,
    aliases: ["brett"],
  },
];

/* ===========================================================
   ==================   HELPERS   =============================
   =========================================================== */

/** Devuelve todos los tokens soportados por una chain específica. */
export function useTokenCatalog(chainId?: ChainId): TokenMeta[] {
  if (!chainId) return TOKENS_CATALOG;
  return TOKENS_CATALOG.filter((t) => t.supportedChains.includes(chainId));
}

/** Comprueba si tenemos metadata suficiente para un token en una red concreta. */
export function hasTokenMeta(tokenId: string, chainKey: string): boolean {
  const chainId = CHAIN_ID_BY_KEY[chainKey];
  if (!chainId) return false;

  const token = TOKENS_CATALOG.find((t) => t.id === tokenId);
  if (!token) return false;

  return token.supportedChains.includes(chainId);
}

/** Devuelve el token principal por símbolo (case-insensitive). */
export function findTokenBySymbol(symbol: string): TokenMeta | undefined {
  const s = symbol.toUpperCase();
  return TOKENS_CATALOG.find((t) => t.symbol === s);
}

/** Añade un nuevo token dinámicamente (útil si importamos 40+). */
export function addToken(meta: TokenMeta) {
  if (!TOKENS_CATALOG.find((t) => t.id === meta.id)) {
    TOKENS_CATALOG.push(meta);
  }
}