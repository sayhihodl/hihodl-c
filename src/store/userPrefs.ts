// src/store/userPrefs.ts
import { create } from "zustand";

type ChainKey = "solana" | "base" | "polygon" | "ethereum";
type TokenId  = "usdc" | "usdt" | "eth" | "sol" | string;
type Account  = "Daily" | "Savings" | "Social";

type UserPrefsState = {
  defaultTokenId?: TokenId;       // ej. "usdc"
  defaultAccount?: Account;       // ej. "Daily"
  setDefaultTokenId: (t?: TokenId) => void;
  setDefaultAccount: (a?: Account) => void;
};

export const useUserPrefs = create<UserPrefsState>()((set) => ({
  defaultTokenId: undefined,
  defaultAccount: "Daily",
  setDefaultTokenId: (t?: TokenId) => set({ defaultTokenId: t }),
  setDefaultAccount: (a?: Account) => set({ defaultAccount: a }),
}));