// src/send/SendFlowProvider.tsx
import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";

export type Step = "search" | "token" | "amount" | "confirm";

/** opcional: meta bonita para futuras UIs */
export type TokenMeta = {
  id: string;            // "usdc" | "usdt" | "sol"
  chain: string;         // "solana" | "base" | ...
  symbol: string;        // "USDC" | "USDT" | "SOL"
  displaySymbol?: string;
  displayName?: string;
  name?: string;
  brand?: string;
  iconKey?: string;
  decimals?: number;
};

export type SendFlowState = {
  toType?: string;
  toRaw?: string;
  toDisplay?: string;
  chain?: string;
  resolved?: string;
  label?: string;

  /** 👇 compat con pantallas actuales */
  tokenId?: string;

  /** 👇 futuro: meta completa (opcional, no obliga nada ahora) */
  token?: TokenMeta;

  amount?: string;
  avatarUrl?: string;
  account?: "daily" | "savings" | "social";
};

type AllowedSteps = Array<Exclude<Step, "search">>;
export type SendFlowContext = {
  state: SendFlowState;
  step: Step;
  patch: (p: Partial<SendFlowState>) => void;
  goTo: (s: Step) => void;
};

type Props = {
  children: React.ReactNode;
  initialState?: Partial<SendFlowState>;
  initialStep?: Exclude<Step, "search">;
  allowedSteps?: AllowedSteps;
};

const SendFlowCtx = createContext<SendFlowContext | null>(null);
SendFlowCtx.displayName = "SendFlowCtx";

export function SendFlowProvider({
  children,
  initialState,
  initialStep = "token",
  allowedSteps = ["token", "amount", "confirm"],
}: Props) {
  const [state, setState] = useState<SendFlowState>({
    toRaw: "",
    toDisplay: "",
    label: "",
    chain: undefined,
    tokenId: undefined,
    token: undefined,
    amount: "",
    account: "daily",
    ...initialState,
  });

  const [step, setStep] = useState<Step>(initialStep);
  const allowedRef = useRef(allowedSteps);
  allowedRef.current = allowedSteps;

  const patch = useCallback((p: Partial<SendFlowState>) => {
    setState((s) => ({ ...s, ...p }));
  }, []);

  const goTo = useCallback((next: Step) => {
    if (next !== "search" && !allowedRef.current.includes(next)) return;
    setStep(next);
  }, []);

  const value = useMemo<SendFlowContext>(() => ({ state, step, patch, goTo }), [state, step, patch, goTo]);

  return <SendFlowCtx.Provider value={value}>{children}</SendFlowCtx.Provider>;
}

export function useSendFlow(): SendFlowContext {
  const ctx = useContext(SendFlowCtx);
  if (!ctx) throw new Error("useSendFlow must be used inside <SendFlowProvider>");
  return ctx;
}

export function useSendFlowSelector<T>(selector: (ctx: SendFlowContext) => T): T {
  const ctx = useSendFlow();
  return selector(ctx);
}