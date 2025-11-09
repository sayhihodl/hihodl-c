// src/lib/tokenChains.ts
// Utilidad para obtener chains de un token y determinar si es multi-chain

import { useMemo } from "react";
import type { ChainId, CurrencyId } from "@/store/portfolio.store";
import { usePortfolioStore } from "@/store/portfolio.store";

/**
 * Hook para obtener chains de un token
 * Retorna todas las chains únicas donde existe el token
 */
export function useTokenChains(currencyId: CurrencyId): ChainId[] {
  const positions = usePortfolioStore((s) => s.flat || []);
  
  return useMemo(() => {
    const tokenPositions = positions.filter((p) => p.currencyId === currencyId);
    const chainsSet = new Set<ChainId>();
    
    tokenPositions.forEach((p) => {
      if (p.chainId) {
        chainsSet.add(p.chainId as ChainId);
      }
    });
    
    return Array.from(chainsSet);
  }, [positions, currencyId]);
}

/**
 * Determina si un token está en múltiples chains
 */
export function useIsMultiChainToken(currencyId: CurrencyId): boolean {
  const chains = useTokenChains(currencyId);
  return chains.length > 1;
}

