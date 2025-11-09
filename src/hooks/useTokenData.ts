// src/hooks/useTokenData.ts
// Hook para transformar positions en TokenRows con toda la lógica de filtrado y seeding

import { useMemo } from "react";
import type { Position } from "@/store/portfolio.store";
import type { Account } from "./useAccount";
import { filterPositionsByAccount, seedEducationalTokens, filterVisibleRows } from "@/utils/dashboard/positionHelpers";
import { buildAggregatedRows, buildSplitRows, normalizeChainId, type TokenRow } from "@/utils/dashboard/tokenHelpers";
import { DASHBOARD_LAYOUT } from "@/constants/dashboard";

export interface UseTokenDataResult {
  rows: TokenRow[];
  visibleRows: TokenRow[];
  topRows: TokenRow[];
  totalUSD: number;
  showViewAll: boolean;
}

/**
 * Hook que maneja toda la transformación de positions a TokenRows
 * Incluye:
 * - Filtrado por cuenta
 * - Seeding de tokens educativos
 * - Transformación aggregated/split
 * - Filtrado de dust
 * - Limite de preview
 */
export function useTokenData(
  positions: Position[],
  account: Account,
  mode: "aggregated" | "split",
  showDust: boolean,
  walletType: "new" | "imported"
): UseTokenDataResult {
  // 1. Filtrar positions por cuenta
  const positionsForAccount = useMemo(
    () => filterPositionsByAccount(positions, account),
    [positions, account]
  );

  // 2. Seed tokens educativos si es wallet nueva
  const positionsSeeded = useMemo(
    () => seedEducationalTokens(positionsForAccount, account, walletType),
    [positionsForAccount, account, walletType]
  );

  // 3. Transformar a rows (aggregated o split)
  const { rows } = useMemo(
    () => {
      const buildFn = mode === "aggregated" ? buildAggregatedRows : buildSplitRows;
      return buildFn(positionsSeeded, normalizeChainId);
    },
    [positionsSeeded, mode]
  );

  // 4. Filtrar visible rows (dust + educación)
  const visibleRows = useMemo(
    () => filterVisibleRows(rows, showDust, walletType === "new", account),
    [rows, showDust, walletType, account]
  );

  // 5. Limitar preview y calcular total
  const topRows = useMemo(
    () => visibleRows.slice(0, DASHBOARD_LAYOUT.MAX_TOKENS_PREVIEW),
    [visibleRows]
  );

  const showViewAll = useMemo(
    () => visibleRows.length > DASHBOARD_LAYOUT.MAX_TOKENS_PREVIEW,
    [visibleRows]
  );

  const totalUSD = useMemo(
    () => positionsSeeded.reduce((a, x) => a + x.fiatValue, 0),
    [positionsSeeded]
  );

  return {
    rows,
    visibleRows,
    topRows,
    totalUSD,
    showViewAll,
  };
}

