// src/utils/dashboard/tokenHelpers.ts
// Helpers para transformación de positions a TokenRow

import type { Position, ChainId, CurrencyId } from "@/store/portfolio.store";

export type TokenRow = {
  id: string;
  name: string;
  subtitle: string;
  valueUSD: number;
  nativeAmt: number;
  currencyId: CurrencyId;
  chainId?: ChainId;
  chains?: ChainId[];
  delta24hUSD?: number;
  delta24hPct?: number;
  _fiatSort?: number;
};

/**
 * Agrupa positions por currencyId
 */
export function groupByCurrency(positions: Position[]): Record<string, Position[]> {
  const map: Record<string, Position[]> = {};
  for (const p of positions) {
    const key = String(p.currencyId);
    if (!map[key]) map[key] = [];
    map[key].push(p);
  }
  return map;
}

/**
 * Obtiene el delta USD de un position
 */
export function pickDeltaUSD(p: Position): number {
  const dx = (p as any)?.change24hUSD;
  if (typeof dx === "number") return dx;
  const pct = (p as any)?.pctChange24h;
  if (typeof pct === "number") return (p.fiatValue * pct) / 100;
  return 0;
}

/**
 * Calcula el porcentaje de cambio promedio ponderado por valor
 */
export function pickDeltaPctWeighted(list: Position[], _totalUSD: number): number | undefined {
  let acc = 0;
  let weightSum = 0;
  for (const p of list) {
    const pct = (p as any)?.pctChange24h;
    if (typeof pct === "number" && isFinite(pct)) {
      acc += (p.fiatValue ?? 0) * pct;
      weightSum += (p.fiatValue ?? 0);
    }
  }
  return weightSum > 0 ? acc / weightSum : undefined;
}

/**
 * Normaliza ChainId (convierte formatos antiguos)
 */
export function normalizeChainId(id: ChainId): ChainId {
  if ((id as unknown as string) === "base:mainnet") return "eip155:8453" as ChainId;
  return id;
}

/**
 * Constantes de currency labels y symbols
 */
export const CURRENCY_LABEL: Record<CurrencyId | "BTC.native" | "DAI.maker", string> = {
  "USDC.circle": "USDC",
  "SOL.native": "Solana",
  "ETH.native": "Ethereum",
  "POL.native": "Polygon",
  "USDT.tether": "USDT",
  "BTC.native": "Bitcoin",
  "DAI.maker": "DAI",
};

export const CURRENCY_SYMBOL: Record<CurrencyId | "BTC.native" | "DAI.maker", string> = {
  "USDC.circle": "USDC",
  "SOL.native": "SOL",
  "ETH.native": "ETH",
  "POL.native": "POL",
  "USDT.tether": "USDT",
  "BTC.native": "BTC",
  "DAI.maker": "DAI",
};

/**
 * Orden recomendado de chains para selección
 */
export const RECOMMENDED_ORDER: ChainId[] = ["solana:mainnet", "eip155:8453", "eip155:137", "eip155:1"];

/**
 * Selecciona la chain recomendada de una lista
 */
export function pickRecommendedChain(chains: ChainId[]): ChainId {
  return (RECOMMENDED_ORDER.find((c) => chains.includes(c)) ?? chains[0] ?? "eip155:1") as ChainId;
}

/**
 * Construye filas agregadas (grouped by currency)
 */
export function buildAggregatedRows(
  positions: Position[],
  normalizeFn: (id: ChainId) => ChainId = normalizeChainId
): { rows: TokenRow[]; byCurrency: Record<string, Position[]> } {
  const byCurrency = groupByCurrency(positions);
  const rows: TokenRow[] = Object.entries(byCurrency).map(([currencyId, list]) => {
    const totalUSD = list.reduce((acc, x) => acc + x.fiatValue, 0);
    const totalNative = list.reduce((acc, x) => acc + x.balance, 0);
    const chainsArr = Array.from(new Set(list.map((x) => normalizeFn(x.chainId))));
    const subtitle = `${totalNative.toLocaleString(undefined, { maximumFractionDigits: 6 })} ${CURRENCY_SYMBOL[currencyId as CurrencyId]}`;
    const delta24hUSD = list.reduce((a, p) => a + pickDeltaUSD(p), 0);
    const delta24hPct = pickDeltaPctWeighted(list, totalUSD);
    return {
      id: currencyId,
      name: CURRENCY_LABEL[currencyId as CurrencyId] ?? currencyId,
      subtitle,
      valueUSD: totalUSD,
      nativeAmt: totalNative,
      currencyId: currencyId as CurrencyId,
      chains: chainsArr,
      delta24hUSD,
      delta24hPct,
      _fiatSort: totalUSD,
    };
  });
  rows.sort((a, b) => (b._fiatSort ?? 0) - (a._fiatSort ?? 0));
  return { rows, byCurrency };
}

/**
 * Construye filas separadas (one row per position)
 */
export function buildSplitRows(
  positions: Position[],
  normalizeFn: (id: ChainId) => ChainId = normalizeChainId
): { rows: TokenRow[]; byCurrency: Record<string, Position[]> } {
  const rows: TokenRow[] = positions.map((p) => ({
    id: `${p.currencyId}:${p.chainId}`,
    name: CURRENCY_LABEL[p.currencyId],
    subtitle: `${p.balance.toLocaleString(undefined, { maximumFractionDigits: 6 })} ${CURRENCY_SYMBOL[p.currencyId]}`,
    valueUSD: p.fiatValue,
    nativeAmt: p.balance,
    currencyId: p.currencyId,
    chainId: p.chainId,
    chains: [normalizeFn(p.chainId)],
    delta24hUSD: pickDeltaUSD(p),
    delta24hPct: (p as any)?.pctChange24h,
    _fiatSort: p.fiatValue,
  }));
  rows.sort((a, b) => (b._fiatSort ?? 0) - (a._fiatSort ?? 0));
  return { rows, byCurrency: groupByCurrency(positions) };
}

