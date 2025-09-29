import { create } from "zustand";

export type CurrencyId = string;

type SettingsState = {
  slippage: { mode: "auto" | "fixed"; fixedPct: number }; // %
  priority: { mode: "auto" | "custom"; customSol: number }; // SOL
  tip: { mode: "auto" | "custom"; pct: number }; // %
};

type SwapState = {
  pay?: CurrencyId;
  receive?: CurrencyId;

  // settings
  settings: SettingsState;

  // actions
  setToken: (side: "pay" | "receive", id: CurrencyId) => void;
  swapSides: () => void;
  setSettings: (partial: Partial<SettingsState>) => void;
  setSlippage: (mode: "auto" | "fixed", fixedPct?: number) => void;
  setPriority: (mode: "auto" | "custom", customSol?: number) => void;
  setTip: (mode: "auto" | "custom", pct?: number) => void;
};

export const useSwapStore = create<SwapState>((set, get) => ({
  pay: undefined,
  receive: undefined,

  settings: {
    slippage: { mode: "auto", fixedPct: 0.5 },
    priority: { mode: "auto", customSol: 0 },
    tip: { mode: "auto", pct: 0.05 }, // 0.05% auto por defecto
  },

  setToken: (side, id) =>
    set((s) => ({ ...s, [side]: id })),

  swapSides: () =>
    set((s) => ({ pay: s.receive, receive: s.pay })),

  setSettings: (partial) =>
    set((s) => ({ settings: { ...s.settings, ...partial } })),

  setSlippage: (mode, fixedPct) =>
    set((s) => ({
      settings: {
        ...s.settings,
        slippage: { mode, fixedPct: fixedPct ?? s.settings.slippage.fixedPct },
      },
    })),

  setPriority: (mode, customSol) =>
    set((s) => ({
      settings: {
        ...s.settings,
        priority: { mode, customSol: customSol ?? s.settings.priority.customSol },
      },
    })),

  setTip: (mode, pct) =>
    set((s) => ({
      settings: {
        ...s.settings,
        tip: { mode, pct: pct ?? s.settings.tip.pct },
      },
    })),
}));