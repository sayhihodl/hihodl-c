// src/hooks/useWalletDetection.ts
// Hook para detectar si una wallet es nueva o importada

import { useMemo } from "react";
import type { Position } from "@/store/portfolio.store";

/**
 * Detecta si una wallet es nueva (creada desde 0) o importada
 * 
 * Lógica:
 * - Wallet nueva si: no hay balances significativos Y (pocas posiciones O tokens en múltiples cuentas)
 * - Wallet importada si: tiene balances significativos O todas las posiciones están en Daily
 */
export function useWalletDetection(positions: Position[]): "new" | "imported" {
  return useMemo(() => {
    // Calcular valor total
    const totalValue = positions.reduce((sum, p) => sum + (p.fiatValue ?? 0), 0);
    
    // Verificar si hay balances significativos
    const hasSignificantBalance = positions.some(
      p => (p.balance ?? 0) > 0.001 || (p.fiatValue ?? 0) > 1
    );
    
    // Verificar si hay tokens distribuidos entre cuentas (wallet nueva)
    // vs todos en Daily (importada)
    const accountIds = positions
      .map(p => p.accountId?.toLowerCase())
      .filter((id): id is string => !!id);
    const hasTokensInMultipleAccounts = new Set(accountIds).size > 1;
    
    // Wallet nueva si:
    // 1. No hay balances significativos Y
    // 2. (Pocas posiciones O tokens en múltiples cuentas)
    const isNew = (!hasSignificantBalance && positions.length < 3) || 
                   (hasTokensInMultipleAccounts && !hasSignificantBalance);
    
    return isNew ? "new" : "imported";
  }, [positions]);
}

