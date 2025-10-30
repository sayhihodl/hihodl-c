import { useEffect, useMemo, useRef, useState } from "react";

export type SwapQuoteInput = {
  payTokenId?: string;
  receiveTokenId?: string;
  amountStr: string; // raw user input, decimal string
  slippagePct: number; // effective slippage percent
};

export type SwapQuote = {
  outAmount: number; // simplified mock result
  price: number; // price pay->receive
  impactPct: number;
  routerFeeUsd: number;
  gasUsd: number;
  router: "primary" | "fallback";
};

type State = {
  loading: boolean;
  data?: SwapQuote;
  error?: string;
  errorCode?: "network" | "degraded" | "no_liquidity" | "unknown";
};

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function parseAmount(amountStr: string): number {
  const norm = amountStr.replace(",", ".").trim();
  const n = Number(norm);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

export function useSwapQuote({ payTokenId, receiveTokenId, amountStr, slippagePct }: SwapQuoteInput) {
  const [state, setState] = useState<State>({ loading: false });

  // debounce user input (and token changes) 300ms
  const depsKey = `${payTokenId ?? "-"}|${receiveTokenId ?? "-"}|${amountStr}|${slippagePct}`;
  const [debouncedKey, setDebouncedKey] = useState(depsKey);
  useEffect(() => {
    const id = setTimeout(() => setDebouncedKey(depsKey), 300);
    return () => clearTimeout(id);
  }, [depsKey]);

  const parsedAmount = useMemo(() => parseAmount(amountStr), [debouncedKey]);

  const inFlightRef = useRef(0);

  useEffect(() => {
    const canQuote = !!payTokenId && !!receiveTokenId && parsedAmount > 0;
    if (!canQuote) {
      setState({ loading: false, data: undefined, error: undefined });
      return;
    }

    let cancelled = false;
    const seq = ++inFlightRef.current;

    async function fetchWithRetry() {
      setState((s) => ({ ...s, loading: true, error: undefined }));

      const maxRetries = 3;
      let attempt = 0;
      let lastErr: any;

      while (attempt < maxRetries) {
        try {
          // mock latency 250-450ms
          await sleep(250 + Math.random() * 200);
          // mock occasional transient error
          if (Math.random() < 0.08) throw new Error("transient");

          // mock pricing: 1 pay = p receive
          const price = 1 + (Math.random() - 0.5) * 0.02; // ~ +/-1%
          const outAmount = parsedAmount * price * (1 - slippagePct / 100);
          const impactPct = Math.max(0, (Math.random() - 0.85) * 1.2); // small
          const routerFeeUsd = 0.02 + Math.random() * 0.08;
          const gasUsd = 0.05 + Math.random() * 0.15;

          if (!cancelled && seq === inFlightRef.current) {
            setState({ loading: false, data: { outAmount, price, impactPct, routerFeeUsd, gasUsd, router: "primary" } });
          }
          return;
        } catch (e: any) {
          lastErr = e;
          attempt += 1;
          const backoff = 200 * Math.pow(2, attempt - 1); // 200, 400, 800ms
          await sleep(backoff);
        }
      }

      // fallback router attempt once
      try {
        await sleep(180 + Math.random() * 160);
        // simulate degraded but working path with slightly worse price
        const price = 1 + (Math.random() - 0.5) * 0.03;
        const outAmount = parsedAmount * price * (1 - slippagePct / 100) * 0.998; // a bit worse
        const impactPct = Math.max(0.2, (Math.random() - 0.7) * 1.6);
        const routerFeeUsd = 0.04 + Math.random() * 0.1;
        const gasUsd = 0.06 + Math.random() * 0.18;
        if (!cancelled && seq === inFlightRef.current) {
          setState({ loading: false, data: { outAmount, price, impactPct, routerFeeUsd, gasUsd, router: "fallback" } });
          return;
        }
      } catch {}

      if (!cancelled && seq === inFlightRef.current) {
        const code: State["errorCode"] = lastErr?.message === "no_liquidity" ? "no_liquidity" : lastErr?.message === "transient" ? "degraded" : "network";
        setState({ loading: false, error: lastErr?.message || "quote_failed", errorCode: code });
      }
    }

    void fetchWithRetry();
    return () => {
      cancelled = true;
    };
  }, [payTokenId, receiveTokenId, parsedAmount, slippagePct, debouncedKey]);

  return state;
}


