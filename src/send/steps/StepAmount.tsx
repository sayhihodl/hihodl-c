// @/send/SendFlowProvider.tsx
import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useRef,
} from "react";

/* ============================== tipos ============================== */
export type Step = "search" | "token" | "amount" | "confirm";

export type SendFlowState = {
  toType?: string;
  toRaw?: string;
  toDisplay?: string;
  chain?: string;
  resolved?: string;
  label?: string;
  tokenId?: string;
  amount?: string;
  avatarUrl?: string;
  /** cuenta desde la que paga */
  account?: "daily" | "savings" | "social";
};

type AllowedSteps = Array<Exclude<Step, "search">>;

type SendFlowContext = {
  state: SendFlowState;
  step: Step;
  patch: (p: Partial<SendFlowState>) => void;
  goTo: (s: Step) => void;
};

/** props del provider */
type Props = {
  children: React.ReactNode;
  initialState?: Partial<SendFlowState>;
  initialStep?: Exclude<Step, "search">; // default "token"
  allowedSteps?: AllowedSteps;           // default ["token","amount","confirm"]
};

/* ============================== contexto ============================== */
const SendFlowCtx = createContext<SendFlowContext | null>(null);
SendFlowCtx.displayName = "SendFlowCtx";

/* ============================== provider ============================== */
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

  const value = useMemo<SendFlowContext>(
    () => ({ state, step, patch, goTo }),
    [state, step, patch, goTo]
  );

  return <SendFlowCtx.Provider value={value}>{children}</SendFlowCtx.Provider>;
}

/* ============================== hooks ============================== */
export function useSendFlow() {
  const ctx = useContext(SendFlowCtx);
  if (!ctx) throw new Error("useSendFlow must be used inside <SendFlowProvider>");
  return ctx;
}

/** Selector opcional para evitar re-render del árbol completo */
export function useSendFlowSelector<T>(selector: (ctx: SendFlowContext) => T): T {
  const ctx = useSendFlow();
  return selector(ctx);
}