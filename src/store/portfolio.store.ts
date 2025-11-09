// src/store/portfolio.store.ts   ⬅️ carpeta: "store" (no "stores")

import type { TokenCatalogItem } from "@/lib/token-catalog";
// Si prefieres evitar este import para tipos, puedes usar este fallback:
// export type TokenCatalogItem = { chain: string; address: string; symbol: string; name: string; logoURI?: string };

export type ChainId =
  | "solana:mainnet"
  | "eip155:1"
  | "eip155:8453"
  | "eip155:137";

export type CurrencyId =
  | "USDC.circle"
  | "SOL.native"
  | "ETH.native"
  | "POL.native"
  | "USDT.tether";

export type Position = {
  id?: string;
  accountId?: string;   // "daily" | "savings" | "social"
  chainId: ChainId;
  currencyId: CurrencyId;
  balance: number;
  fiatValue: number;
  change24hUSD?: number;
  pctChange24h?: number;
};

type Mode = "aggregated" | "split";

type State = {
  // datos
  positions: Position[];
  mode: Mode;
  watchlist: TokenCatalogItem[];

  // acciones
  setMode: (m: Mode) => void;
  addWatchToken: (t: TokenCatalogItem) => void;
};

// ====== Estado mock en memoria ======
// Para wallets nuevas (creadas desde 0): los datos deben reflejar las reglas:
// - Daily: tokens utility (USDC, USDT)
// - Savings: ETH y SOL para holdear (balance 0 para educación en wallets nuevas)
// - Social: memecoins (POL como placeholder educativo, balance 0)
// Para wallets importadas: todos los tokens van a Daily
const state: State = {
  mode: "aggregated",
  positions: [
    // Daily: tokens utility (balance 0 para wallet nueva - se mostrarán para educación)
    {
      accountId: "daily",
      chainId: "eip155:1",
      currencyId: "USDC.circle",
      balance: 0,
      fiatValue: 0,
      pctChange24h: 0,
      change24hUSD: 0,
    },
    {
      accountId: "daily",
      chainId: "eip155:8453",
      currencyId: "USDT.tether",
      balance: 0,
      fiatValue: 0,
      pctChange24h: 0,
      change24hUSD: 0,
    },
    // Savings: ETH y SOL para holdear a largo plazo (balance 0 para wallets nuevas)
    // Agregamos más tokens para mostrar "View all" cuando hay más de 4
    {
      accountId: "savings",
      chainId: "eip155:1",
      currencyId: "ETH.native",
      balance: 0.05,
      fiatValue: 125.50,
      pctChange24h: 1.8,
      change24hUSD: 2.26,
    },
    {
      accountId: "savings",
      chainId: "solana:mainnet",
      currencyId: "SOL.native",
      balance: 12.5,
      fiatValue: 1820.25,
      pctChange24h: -0.9,
      change24hUSD: -16.38,
    },
    {
      accountId: "savings",
      chainId: "eip155:1",
      currencyId: "USDC.circle",
      balance: 500,
      fiatValue: 500,
      pctChange24h: 0,
      change24hUSD: 0,
    },
    {
      accountId: "savings",
      chainId: "eip155:8453",
      currencyId: "USDC.circle",
      balance: 200,
      fiatValue: 200,
      pctChange24h: 0,
      change24hUSD: 0,
    },
    {
      accountId: "savings",
      chainId: "eip155:137",
      currencyId: "USDC.circle",
      balance: 100,
      fiatValue: 100,
      pctChange24h: 0,
      change24hUSD: 0,
    },
    {
      accountId: "savings",
      chainId: "solana:mainnet",
      currencyId: "USDC.circle",
      balance: 50,
      fiatValue: 50,
      pctChange24h: 0,
      change24hUSD: 0,
    },
    {
      accountId: "savings",
      chainId: "eip155:1",
      currencyId: "USDT.tether",
      balance: 100,
      fiatValue: 100,
      pctChange24h: 0,
      change24hUSD: 0,
    },
    {
      accountId: "savings",
      chainId: "eip155:8453",
      currencyId: "USDT.tether",
      balance: 250,
      fiatValue: 250,
      pctChange24h: 0,
      change24hUSD: 0,
    },
    {
      accountId: "savings",
      chainId: "eip155:137",
      currencyId: "USDT.tether",
      balance: 75,
      fiatValue: 75,
      pctChange24h: 0,
      change24hUSD: 0,
    },
    {
      accountId: "savings",
      chainId: "solana:mainnet",
      currencyId: "USDT.tether",
      balance: 25,
      fiatValue: 25,
      pctChange24h: 0,
      change24hUSD: 0,
    },
    {
      accountId: "savings",
      chainId: "eip155:137",
      currencyId: "POL.native",
      balance: 1000,
      fiatValue: 450.80,
      pctChange24h: 2.1,
      change24hUSD: 9.47,
    },
    // Social: memecoin educativo (POL como placeholder, balance 0)
    {
      accountId: "social",
      chainId: "eip155:137",
      currencyId: "POL.native",
      balance: 0,
      fiatValue: 0,
      pctChange24h: 2.1,
    },
  ],
  watchlist: [],

  setMode: (m) => {
    state.mode = m;
  },

  addWatchToken: (t) => {
    const key = `${t.chain}:${t.address}`.toLowerCase();
    const exists = state.watchlist.some(
      (x) => `${x.chain}:${x.address}`.toLowerCase() === key
    );
    if (!exists) state.watchlist.push(t);
  },
};

// “Hook” selector-style (mock sin Zustand). Mantén la misma API.
export function usePortfolioStore<T>(selector: (s: State) => T): T {
  return selector(state);
}