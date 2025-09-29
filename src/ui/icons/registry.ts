import type { ImageSourcePropType } from "react-native";

// Ajusta estos tipos a los tuyos si ya existen
export type ChainKey = "solana" | "ethereum" | "base" | "polygon" | "tron";
export type TokenKey = "SOL" | "ETH" | "USDC" | "USDT" | "MATIC" | "TRX";

const UNKNOWN: ImageSourcePropType = require("@/assets/icons/unknown.png");

// CHAIN ICONS (png/svg exportado a png)
export const CHAIN_ICONS: Record<ChainKey, ImageSourcePropType> = {
  solana:   require("@/assets/chains/solana.png"),
  ethereum: require("@/assets/chains/ethereum.png"),
  base:     require("@/assets/chains/base.png"),
  polygon:  require("@/assets/chains/polygon.png"),
  tron:     require("@/assets/chains/tron.png"),
};

// TOKEN ICONS
export const TOKEN_ICONS: Record<TokenKey, ImageSourcePropType> = {
  SOL:  require("@/assets/tokens/SOL.png"),
  ETH:  require("@/assets/tokens/ETH.png"),
  USDC: require("@/assets/tokens/USDC.png"),
  USDT: require("@/assets/tokens/USDT.png"),
  MATIC:require("@/assets/tokens/MATIC.png"),
  TRX:  require("@/assets/tokens/TRX.png"),
};

// Helpers con fallback
export const getChainIcon = (key?: string): ImageSourcePropType =>
  (key && CHAIN_ICONS[key as ChainKey]) || UNKNOWN;

export const getTokenIcon = (sym?: string): ImageSourcePropType =>
  (sym && TOKEN_ICONS[(sym.toUpperCase() as TokenKey)]) || UNKNOWN;