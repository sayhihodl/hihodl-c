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
const state: State = {
  mode: "aggregated",
  positions: [
    {
      accountId: "daily",
      chainId: "eip155:1",
      currencyId: "ETH.native",
      balance: 0.82,
      fiatValue: 0.82 * 3500,
      pctChange24h: 1.8,
      change24hUSD: 0.82 * 3500 * 0.018,
    },
    {
      accountId: "daily",
      chainId: "solana:mainnet",
      currencyId: "SOL.native",
      balance: 11.4,
      fiatValue: 11.4 * 170,
      pctChange24h: -0.9,
      change24hUSD: 11.4 * 170 * -0.009,
    },
    {
      accountId: "savings",
      chainId: "eip155:137",
      currencyId: "POL.native",
      balance: 260,
      fiatValue: 260 * 0.7,
      pctChange24h: 2.1,
    },
    {
      accountId: "daily",
      chainId: "eip155:1",
      currencyId: "USDC.circle",
      balance: 520.18,
      fiatValue: 520.18,
      pctChange24h: 0,
      change24hUSD: 0,
    },
    {
      accountId: "social",
      chainId: "eip155:8453",
      currencyId: "USDT.tether",
      balance: 148.35,
      fiatValue: 148.35,
      pctChange24h: 0,
      change24hUSD: 0,
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