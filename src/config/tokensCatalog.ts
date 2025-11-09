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
    logoURI: "https://assets.coingecko.com/coins/images/6319/large/USD_Coin_icon.png",
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
    logoURI: "https://assets.coingecko.com/coins/images/325/large/Tether.png",
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
    supportedChains: ["eip155:1", "eip155:8453"], // ETH también está disponible en Base (Base usa ETH como token nativo)
    coingeckoId: "ethereum",
    logoURI: "https://assets.coingecko.com/coins/images/279/large/ethereum.png",
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
    logoURI: "https://assets.coingecko.com/coins/images/4128/large/solana.png",
    isNative: true,
    priority: 90,
    aliases: ["sol", "solana"],
  },
  {
    id: "POL.native" as CurrencyId,
    symbol: "POL",
    name: "Polygon",
    decimals: 18,
    nativeChainId: "eip155:137" as ChainId,
    supportedChains: ["eip155:137"],
    coingeckoId: "matic-network",
    logoURI: "https://assets.coingecko.com/coins/images/4713/large/matic-token-icon.png",
    isNative: true,
    priority: 85,
    aliases: ["pol", "polygon", "matic"],
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
    logoURI: "https://assets.coingecko.com/coins/images/28600/large/bonk.png",
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
    logoURI: "https://assets.coingecko.com/coins/images/34188/large/jup.png",
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
    logoURI: "https://assets.coingecko.com/coins/images/13928/large/400x400_rays_logo.png",
    priority: 78,
    aliases: ["ray", "raydium"],
  },
  {
    id: "JTO.token" as CurrencyId,
    symbol: "JTO",
    name: "Jito",
    decimals: 6,
    nativeChainId: "solana:mainnet" as ChainId,
    supportedChains: ["solana:mainnet"],
    coingeckoId: "jito-governance-token",
    logoURI: "https://assets.coingecko.com/coins/images/33958/large/jito.png",
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
    logoURI: "https://assets.coingecko.com/coins/images/35614/large/wif.png",
    priority: 75,
    aliases: ["wif", "dogwifhat"],
  },
  // REMOVIDO: PYTH - token poco conocido según feedback del usuario
  {
    id: "MSOL.token" as CurrencyId,
    symbol: "MSOL",
    name: "Marinade staked SOL",
    decimals: 9,
    nativeChainId: "solana:mainnet" as ChainId,
    supportedChains: ["solana:mainnet"],
    coingeckoId: "marinade-staked-sol",
    logoURI: "https://assets.coingecko.com/coins/images/17752/large/mSOL.png",
    priority: 76,
    aliases: ["marinade", "msoL", "staked sol"],
  },
  // REMOVIDO: WEN - token poco conocido según feedback del usuario

  // ===== ETH / Base / Polygon (clásicos) =====
  {
    id: "DAI.native" as CurrencyId,
    symbol: "DAI",
    name: "Dai Stablecoin",
    decimals: 18,
    nativeChainId: "eip155:1" as ChainId,
    supportedChains: ["eip155:1", "eip155:8453", "eip155:137"],
    coingeckoId: "dai",
    logoURI: "https://assets.coingecko.com/coins/images/9956/large/Badge_Dai.png",
    priority: 80,
    aliases: ["dai"],
  },
  {
    id: "PYUSD.paypal" as CurrencyId,
    symbol: "PYUSD",
    name: "PayPal USD",
    decimals: 6,
    nativeChainId: "eip155:1" as ChainId,
    supportedChains: ["eip155:1", "solana:mainnet"],
    coingeckoId: "paypal-usd",
    logoURI: "https://assets.coingecko.com/coins/images/33192/large/PYUSD.png",
    priority: 85,
    aliases: ["pyusd", "paypal usd"],
  },
  {
    id: "FRAX.token" as CurrencyId,
    symbol: "FRAX",
    name: "Frax",
    decimals: 18,
    nativeChainId: "eip155:1" as ChainId,
    supportedChains: ["eip155:1", "eip155:137"],
    coingeckoId: "frax",
    logoURI: "https://assets.coingecko.com/coins/images/13422/large/FRAX_icon.png",
    priority: 75,
    aliases: ["frax"],
  },
  {
    id: "WBTC.native" as CurrencyId,
    symbol: "WBTC",
    name: "Wrapped Bitcoin",
    decimals: 8,
    nativeChainId: "eip155:1" as ChainId,
    supportedChains: ["eip155:1", "eip155:137"],
    coingeckoId: "wrapped-bitcoin",
    logoURI: "https://assets.coingecko.com/coins/images/7598/large/wrapped_bitcoin_wbtc.png",
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
    logoURI: "https://assets.coingecko.com/coins/images/13573/large/Lido_DAO.png",
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
    logoURI: "https://assets.coingecko.com/coins/images/877/large/chainlink-new-logo.png",
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
    logoURI: "https://assets.coingecko.com/coins/images/12504/large/uniswap-uni.png",
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
    logoURI: "https://assets.coingecko.com/coins/images/12645/large/AAVE.png",
    priority: 68,
    aliases: ["aave"],
  },

  // ===== Base (memes/infra del ecosistema) =====
  // REMOVIDO: DEGEN y BRETT - tokens poco conocidos según feedback del usuario
  // Si en el futuro son más populares, se pueden re-agregar
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

/** Devuelve el token por ID de moneda (case-insensitive). */
export function findTokenById(currencyId: string): TokenMeta | undefined {
  const id = currencyId.toLowerCase();
  return TOKENS_CATALOG.find((t) => t.id.toLowerCase() === id);
}

/** Obtiene el CoinGecko ID de un token por símbolo o currencyId */
export function getCoinGeckoId(symbolOrId: string): string | undefined {
  const normalized = symbolOrId.toLowerCase();
  
  // Buscar por currencyId primero
  const byId = findTokenById(normalized);
  if (byId?.coingeckoId) return byId.coingeckoId;
  
  // Buscar por símbolo
  const bySymbol = findTokenBySymbol(normalized);
  if (bySymbol?.coingeckoId) return bySymbol.coingeckoId;
  
  // Buscar por alias
  const byAlias = TOKENS_CATALOG.find((t) => 
    t.aliases?.some((alias) => alias.toLowerCase() === normalized)
  );
  if (byAlias?.coingeckoId) return byAlias.coingeckoId;
  
  return undefined;
}

/** Añade un nuevo token dinámicamente (útil si importamos 40+). */
export function addToken(meta: TokenMeta) {
  if (!TOKENS_CATALOG.find((t) => t.id === meta.id)) {
    TOKENS_CATALOG.push(meta);
  }
}