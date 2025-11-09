// src/utils/dashboard/positionHelpers.ts
// Helpers para manipulación de positions

import type { Position, ChainId, CurrencyId } from "@/store/portfolio.store";
import type { Account } from "@/hooks/useAccount";
import { accountToId } from "@/hooks/useAccount";

/**
 * Stablecoins soportados
 */
export const STABLES: CurrencyId[] = ["USDC.circle", "USDT.tether"];

/**
 * Chains soportados
 */
export const SUPPORTED_CHAINS: ChainId[] = [
  "eip155:1",
  "solana:mainnet",
  "eip155:8453",
  "eip155:137",
];

/**
 * Agrega placeholders de stablecoins si no existen
 */
export function withStablecoinPlaceholders(
  base: Position[],
  account: Account
): Position[] {
  const out = [...base];
  const have = new Set(base.map((p) => `${p.currencyId}::${p.chainId}`));
  
  for (const cur of STABLES) {
    for (const ch of SUPPORTED_CHAINS) {
      const key = `${cur}::${ch}`;
      if (!have.has(key)) {
        out.push({
          // @ts-ignore UI only placeholder
          accountId: accountToId(account),
          currencyId: cur,
          chainId: ch,
          balance: 0,
          fiatValue: 0,
        } as unknown as Position);
      }
    }
  }
  return out;
}

/**
 * Filtra positions por accountId
 */
export function filterPositionsByAccount(
  positions: Position[],
  account: Account
): Position[] {
  const target = accountToId(account).toLowerCase();
  
  const filtered = positions.filter((p: any) => {
    const pAccountId = String(p?.accountId ?? "").toLowerCase();
    // Si no tiene accountId y estamos en Daily, incluirlo (wallet importada)
    if (!pAccountId && account === "Daily") return true;
    return pAccountId === target;
  }).map((p: any) => {
    // Asignar accountId a Daily si no lo tiene (wallet importada)
    if (!p.accountId && account === "Daily") {
      return { ...p, accountId: "daily" };
    }
    return p;
  });
  
  return withStablecoinPlaceholders(filtered, account);
}

/**
 * Crea un position placeholder
 */
function createPosition(
  currencyId: CurrencyId,
  chainId: ChainId,
  usd: number,
  bal: number,
  account: Account,
  pct24h?: number
): Position {
  return {
    accountId: accountToId(account),
    currencyId,
    chainId,
    fiatValue: usd,
    balance: bal,
    pctChange24h: pct24h,
  } as unknown as Position;
}

/**
 * Añade tokens educativos según el tipo de cuenta para wallets nuevas
 */
export function seedEducationalTokens(
  positions: Position[],
  account: Account,
  walletType: "new" | "imported"
): Position[] {
  if (walletType !== "new") {
    return positions;
  }
  
  const dev = [...positions];
  const present = new Set(dev.map((p) => `${p.currencyId}::${p.chainId}`));
  
  const addIfMissing = (
    currencyId: CurrencyId,
    chainId: ChainId,
    usd: number,
    bal: number,
    pct24h?: number
  ) => {
    const key = `${currencyId}::${chainId}`;
    if (present.has(key)) return;
    dev.push(createPosition(currencyId, chainId, usd, bal, account, pct24h));
    present.add(key);
  };

  if (account === "Daily") {
    // Daily: tokens utility (USDC, USDT)
    addIfMissing("USDC.circle", "eip155:1", 0, 0);
    addIfMissing("USDT.tether", "eip155:8453", 0, 0);
  } else if (account === "Savings") {
    // Savings: ETH y SOL para holdear a largo plazo
    addIfMissing("ETH.native", "eip155:1", 0, 0, 1.8);
    addIfMissing("SOL.native", "solana:mainnet", 0, 0, -0.9);
  } else if (account === "Social") {
    // Social: memecoin sin balance (POL como placeholder educativo)
    addIfMissing("POL.native", "eip155:137", 0, 0, 2.1);
  }
  
  return dev;
}

/**
 * Filtra filas según criterio de dust
 */
export function filterVisibleRows<T extends { valueUSD?: number; nativeAmt?: number }>(
  rows: T[],
  showDust: boolean,
  isNewWallet: boolean,
  account: Account
): T[] {
  const DUST_USD = 1;
  const DUST_NATIVE = 0;
  
  const keepRow = (valueUSD: number, nativeAmt: number) =>
    showDust || valueUSD >= DUST_USD || nativeAmt >= DUST_NATIVE;
  
  const filtered = rows.filter(
    r => keepRow(r.valueUSD ?? 0, r.nativeAmt ?? 0)
  );
  
  // Para wallets nuevas, mostrar tokens con balance 0 en Savings y Social (educación)
  if (isNewWallet && (account === "Savings" || account === "Social")) {
    const zeroBalanceRows = rows.filter(
      r => (r.valueUSD ?? 0) === 0 && (r.nativeAmt ?? 0) === 0
    );
    const combined = [...filtered];
    for (const zeroRow of zeroBalanceRows) {
      if (!combined.some(r => (r as any).id === (zeroRow as any).id)) {
        combined.push(zeroRow);
      }
    }
    return combined;
  }
  
  return filtered;
}

