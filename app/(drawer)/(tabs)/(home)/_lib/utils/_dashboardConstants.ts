// app/(drawer)/(tabs)/(home)/utils/dashboardConstants.ts
// Constantes y configuraciones del dashboard

import type { ChainId, CurrencyId } from "@/store/portfolio.store";
import type { Account } from "@/hooks/useAccount";
import type { ColorValue } from "react-native";

export const PREFERRED_ORDER: ChainId[] = ["solana:mainnet", "eip155:1", "eip155:8453", "eip155:137"];

export const CURRENCY_NATIVE_CHAIN: Partial<Record<CurrencyId, ChainId>> = {
  "ETH.native": "eip155:1",
  "SOL.native": "solana:mainnet",
  "POL.native": "eip155:137",
};

export const ACCOUNT_GRADS: Record<Account, readonly [ColorValue, ColorValue]> = {
  Daily: ["rgba(0,194,255,0.45)", "rgba(54,224,255,0.00)"],
  Savings: ["rgba(84,242,165,0.35)", "rgba(84,242,165,0.00)"],
  Social: ["rgba(111,91,255,0.40)", "rgba(255,115,179,0.00)"],
} as const;

export const STABLES: CurrencyId[] = ["USDC.circle", "USDT.tether"];

export const SUPPORTED_CHAINS: ChainId[] = ["eip155:1", "solana:mainnet", "eip155:8453", "eip155:137"];

export const TABS_PREFIX = "/(drawer)/(tabs)";

/**
 * Ordena chains según orden preferido para mostrar badges
 */
export function orderChainsForBadge(list: ChainId[], max = 3): ChainId[] {
  const seen = new Set<ChainId>();
  const out: ChainId[] = [];
  for (const id of PREFERRED_ORDER) {
    if (list.includes(id) && !seen.has(id)) {
      seen.add(id);
      out.push(id);
    }
  }
  for (const id of list) {
    if (!seen.has(id)) {
      seen.add(id);
      out.push(id);
    }
  }
  return out.slice(0, max);
}

// Default export to satisfy Expo Router (this file is not a route)
export default function() { return null; }

