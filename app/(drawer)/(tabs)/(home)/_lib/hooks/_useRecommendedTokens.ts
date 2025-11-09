// app/(drawer)/(tabs)/(home)/hooks/useRecommendedTokens.ts
// Hook para obtener tokens recomendados según el tipo de cuenta

import { useMemo } from "react";
import type { Account } from "@/hooks/useAccount";

/**
 * Hook que retorna tokens recomendados según el tipo de cuenta
 */
export function useRecommendedTokens(account: Account): string[] {
  return useMemo(() => {
    if (account === "Daily") {
      return ["usdc", "usdt"]; // Tokens utility para uso diario
    } else if (account === "Savings") {
      return ["eth", "sol"]; // Tokens para holdear a largo plazo
    } else if (account === "Social") {
      return ["pol"]; // Memecoins para social (POL como placeholder, podría ser PENGU)
    }
    return [];
  }, [account]);
}

// Default export to satisfy Expo Router (this file is not a route)
export default function() { return null; }

