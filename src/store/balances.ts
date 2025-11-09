// src/store/balances.ts
// Store para balances de tokens del usuario
import { create } from "zustand";
import type { ChainKey } from "@/config/sendMatrix";

export type AccountId = "daily" | "savings" | "social";

export type BalanceItem = {
  tokenId: string;
  chain: ChainKey;
  amount: number;
  account: AccountId;
};

type BalancesState = {
  // Lista plana de todos los balances
  flat: BalanceItem[];
  
  // Balance agrupado por token -> chain -> amount
  byToken: Record<string, Partial<Record<ChainKey, number>>>;
  
  // Balance agrupado por cuenta
  byAccount: Record<AccountId, BalanceItem[]>;
  
  // Acciones
  setBalances: (balances: BalanceItem[]) => void;
  updateBalance: (item: BalanceItem) => void;
  clearBalances: () => void;
};

// Estado inicial vacío
const initialState: Omit<BalancesState, "setBalances" | "updateBalance" | "clearBalances"> = {
  flat: [],
  byToken: {},
  byAccount: {
    daily: [],
    savings: [],
    social: [],
  },
};

export const useBalancesStore = create<BalancesState>((set, get) => ({
  ...initialState,
  
  setBalances: (balances) => {
    // Agrupar por token
    const byToken: Record<string, Partial<Record<ChainKey, number>>> = {};
    for (const b of balances) {
      const id = (b.tokenId || "").toLowerCase();
      if (!byToken[id]) byToken[id] = {};
      byToken[id][b.chain] = (byToken[id][b.chain] || 0) + b.amount;
    }
    
    // Agrupar por cuenta
    const byAccount: Record<AccountId, BalanceItem[]> = {
      daily: [],
      savings: [],
      social: [],
    };
    for (const b of balances) {
      byAccount[b.account] = byAccount[b.account] || [];
      byAccount[b.account].push(b);
    }
    
    set({ flat: balances, byToken, byAccount });
  },
  
  updateBalance: (item) => {
    const current = get().flat;
    const existing = current.findIndex(
      (b) => b.tokenId === item.tokenId && b.chain === item.chain && b.account === item.account
    );
    
    let newFlat: BalanceItem[];
    if (existing >= 0) {
      newFlat = [...current];
      newFlat[existing] = item;
    } else {
      newFlat = [...current, item];
    }
    
    get().setBalances(newFlat);
  },
  
  clearBalances: () => {
    set(initialState);
  },
}));

