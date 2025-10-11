import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { Account } from "@/send/types";
export type Step = "search" | "token" | "amount" | "confirm";

export type SendFlowState = {
  open: boolean;
  step: Step;
  /** id de cuenta en minúscula: "daily" | "savings" | "social" | custom */
  account?: string;
  // payload del flujo (lo que ya usas en StepSearch)
  toType?: string;
  toRaw?: string;
  toDisplay?: string;
  chain?: string;
  resolved?: string;
  label?: string;
  tokenId?: string;     // <— token elegido en StepToken
  amount?: string;      // opcional si lo vas a usar después
};

type Ctx = {
  state: SendFlowState;
  /** merge parcial */
  patch: (delta: Partial<SendFlowState>) => void;
  /** cambia de paso */
  goTo: (s: Step) => void;
  /** abre el modal; alias openSend */
  open: (opts?: { startAt?: Step; account?: string }) => void;
  /** cierra el modal */
  close: () => void;
};

// ---------- estado base
const initialState: SendFlowState = { open: false,
  step: "search",
  account: "daily",
  chain: undefined,
  tokenId: undefined,
  amount: undefined, };

const Ctx = createContext<Ctx | null>(null);

export function SendFlowProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<SendFlowState>(initialState);

  const patch = useCallback((delta: Partial<SendFlowState>) => {
    setState((s) => ({ ...s, ...delta }));
  }, []);

  const goTo = useCallback((s: Step) => setState((st) => ({ ...st, step: s })), []);

  const open = useCallback((opts?: { startAt?: Step; account?: string }) => {
    setState((s) => ({
      ...s,
      open: true,
      step: opts?.startAt ?? "search",
      ...(opts?.account ? { account: opts.account } : null),
    }));
  }, []);

  const close = useCallback(() => setState((s) => ({ ...s, open: false })), []);

  const value = useMemo<Ctx>(() => ({ state, patch, goTo, open, close }), [state, patch, goTo, open, close]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

// Hook
export function useSendFlow() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useSendFlow must be used inside <SendFlowProvider>");
  return ctx;
}

// Back-compat por si algo apunta a FlowProvider
export const FlowProvider = SendFlowProvider;