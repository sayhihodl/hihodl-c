import { useEffect, useMemo, useState, useCallback } from "react";

type Asset = { currencyId: string; chainId?: string };
type Quote = { priceUsd: number; percentChange24h: number };

export function useMarketData(assets: Asset[]) {
  const uniq = useMemo(() => {
    const set = new Set(assets.map((a) => `${a.currencyId}:${a.chainId ?? "-"}`));
    return [...set].map((k) => {
      const [currencyId, chainId] = k.split(":");
      return { currencyId, chainId: chainId === "-" ? undefined : chainId };
    });
  }, [assets]);

  const [quotes, setQuotes] = useState<Record<string, Quote>>({});

  const fetchQuotes = useCallback(async () => {
    // MOCK — cámbialo luego por tu API real
    const res: Quote[] = uniq.map(() => ({
      priceUsd: Math.random() * 1000,
      percentChange24h: (Math.random() - 0.5) * 10,
    }));

    const indexed: Record<string, Quote> = {};
    uniq.forEach((a, i) => {
      indexed[`${a.currencyId}:${a.chainId ?? "-"}`] = res[i];
    });
    setQuotes(indexed);
  }, [uniq]);

  useEffect(() => {
    void fetchQuotes(); // primera carga
    const id = setInterval(fetchQuotes, 60_000);
    return () => clearInterval(id);
  }, [fetchQuotes]); // ✅ ahora sin warning

  return (currencyId: string, chainId?: string): Quote | undefined =>
    quotes[`${currencyId}:${chainId ?? "-"}`];
}