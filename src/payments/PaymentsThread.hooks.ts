/**
 * Custom hooks for PaymentsThread
 */
import React, { useMemo, useState, useEffect, useRef } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { usePaymentsStore } from "@/store/payments";
import { useThreads } from "@/store/threads";
import type { AnyMsg } from "./PaymentsThread.types";

const EMPTY_LIST: AnyMsg[] = [];
const EMPTY_LEGACY_ITEMS: any[] = [];

/**
 * Hook to merge payments from new store and legacy store
 */
export function useThreadMessages(threadId: string, legacyPeerKey: string) {
  const [paymentsItems, setPaymentsItems] = useState<AnyMsg[]>(EMPTY_LIST);
  const [legacyItemsRaw, setLegacyItemsRaw] = useState<any[]>(EMPTY_LEGACY_ITEMS);

  // payments store subscription
  useEffect(() => {
    const pick = () => {
      const s = usePaymentsStore.getState() as any;
      const arr: AnyMsg[] =
        (typeof s.selectByThread === "function"
          ? (s.selectByThread(threadId) as AnyMsg[] | undefined)
          : (s.byThread?.[threadId] as AnyMsg[] | undefined)) || EMPTY_LIST;
      setPaymentsItems(arr);
    };
    pick();
    const unsub = usePaymentsStore.subscribe(pick);
    return unsub;
  }, [threadId]);

  // legacy threads store subscription
  useEffect(() => {
    const pick = () => {
      try {
        const s = (useThreads as any).getState?.();
        const arr = (s?.threads?.[legacyPeerKey]?.items as any[]) || EMPTY_LEGACY_ITEMS;
        setLegacyItemsRaw(arr);
      } catch {
        setLegacyItemsRaw(EMPTY_LEGACY_ITEMS);
      }
    };
    pick();
    const unsub = (useThreads as any).subscribe?.(pick);
    return unsub;
  }, [legacyPeerKey]);

  // Merge and dedupe messages
  const items = useMemo(() => {
    const legacyMapped: AnyMsg[] = (legacyItemsRaw || []).flatMap((it: any) => {
      if (!it) return [];
      if (it.kind === "tx") {
        const status = it.status === "processed" ? "pending" : it.status;
        const direction =
          it.direction === "out" || it.direction === "in" ? it.direction : "out";
        return [
          {
            id: String(it.id ?? ""),
            threadId,
            kind: "tx",
            direction,
            tokenId: String(it.token ?? "usdc"),
            chain: String(it.chain ?? "solana"),
            amount: Number(it.amount ?? 0),
            status: status as AnyMsg["status"],
            ts: Number(it.createdAt ?? Date.now()),
            txHash: String(it.signature ?? it.hash ?? it.txHash ?? ""),
          } as AnyMsg,
        ];
      }
      return [];
    });

    const merged: AnyMsg[] = [
      ...paymentsItems.map((m: any) => ({ ...m, kind: m.kind ?? "tx", txHash: m.txId })),
      ...legacyMapped,
    ];

    const mapById = new Map<string, AnyMsg>();
    for (const it of merged) {
      const k = String(it?.id ?? "");
      if (!k) continue;
      mapById.set(k, it);
    }

    const uniq = Array.from(mapById.values());
    return uniq.sort((a, b) => (a.ts ?? 0) - (b.ts ?? 0));
  }, [paymentsItems, legacyItemsRaw, threadId]);

  return items;
}

/**
 * Hook for filtering and searching messages
 */
export function useFilteredMessages(
  items: AnyMsg[],
  filter: "all" | "payments" | "requests",
  query: string,
  displayName: string
) {
  return useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((it) => {
      if (filter === "payments" && it.kind === "request") return false;
      if (filter === "requests" && it.kind !== "request") return false;

      if (!q) return true;
      const amountStr = String((it as any).amount ?? "");
      const token = (it as any).tokenId ?? "";
      const base = token.split(".")[0] || "usdc";
      const tokenTicker = base.toUpperCase().toLowerCase();
      const status = String((it as any).status ?? "").toLowerCase();
      const peer = String((it as any).toDisplay ?? displayName).toLowerCase();
      return (
        amountStr.includes(q) || tokenTicker.includes(q) || status.includes(q) || peer.includes(q)
      );
    });
  }, [items, filter, query, displayName]);
}

/**
 * Hook for pagination
 */
export function usePaginatedItems(items: AnyMsg[], pageSize: number = 30) {
  const [pages, setPages] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);

  const visibleItems = useMemo(() => {
    const total = items.length;
    const keep = Math.max(pageSize, Math.min(total, pageSize * pages));
    return items.slice(Math.max(0, total - keep));
  }, [items, pages, pageSize]);

  const loadMore = () => {
    setLoadingMore(true);
    setTimeout(() => {
      setPages((p) => p + 1);
      setLoadingMore(false);
    }, 200);
  };

  const resetPages = () => setPages(1);

  return { visibleItems, loadingMore, loadMore, resetPages, pages, setPages };
}

/**
 * Hook for transaction status polling
 */
export function useTransactionPolling(
  items: AnyMsg[],
  legacyPeerKey: string,
  alias: string,
  name: string
) {
  const [syncing, setSyncing] = useState(false);
  const notifiedRef = useRef<Set<string>>(new Set());
  const retryCountRef = useRef<Map<string, number>>(new Map());
  const lastAttemptRef = useRef<Map<string, number>>(new Map());
  const isFocusedRef = useRef(true);

  useFocusEffect(
    React.useCallback(() => {
      isFocusedRef.current = true;
      return () => {
        isFocusedRef.current = false;
      };
    }, [])
  );

  useEffect(() => {
    let cancelled = false;
    const MAX_ATTEMPTS = 30;
    const baseDelay = 1000;
    const backoffFor = (attempt: number) =>
      Math.min(15000, Math.round(baseDelay * Math.pow(1.6, attempt)));

    const pending = items.filter(
      (it) =>
        (it as any).kind === "tx" &&
        it.status === "pending" &&
        ((it as any).txHash || (it as any).txId)
    );

    const now = Date.now();
    for (const it of pending) {
      if (!retryCountRef.current.has(it.id)) retryCountRef.current.set(it.id, 0);
      if (!lastAttemptRef.current.has(it.id)) lastAttemptRef.current.set(it.id, 0);
    }
    for (const key of Array.from(retryCountRef.current.keys())) {
      if (!pending.find((p) => p.id === key)) {
        retryCountRef.current.delete(key);
        lastAttemptRef.current.delete(key);
      }
    }
    if (pending.length === 0) {
      setSyncing(false);
      return;
    }
    let timer: any;

    const loop = async () => {
      if (!isFocusedRef.current || cancelled) {
        return;
      }

      setSyncing(true);
      let hadAnyError = false;

      // Import dynamically to avoid circular dependencies
      const { pollSolanaStatus } = await import("@/services/solanaTx");
      const { pollEvmStatus } = await import("@/services/evmTx");
      const { notifyPaymentSent } = await import("@/lib/notifications");
      const { tokenTickerFromId } = await import("./PaymentsThread.utils");

      for (const it of pending) {
        if (!isFocusedRef.current || cancelled) return;
        const attempts = retryCountRef.current.get(it.id) ?? 0;
        if (attempts >= MAX_ATTEMPTS) continue;
        const last = lastAttemptRef.current.get(it.id) ?? 0;
        const waitMs = backoffFor(attempts);
        if (now - last < waitMs) continue;
        const chain = String((it as any).chain || "").toLowerCase();
        const txHash = (it as any).txHash || (it as any).txId;
        let next: "pending" | "confirmed" | "failed" | undefined;
        try {
          if (chain.includes("sol")) {
            const st = await pollSolanaStatus(txHash);
            if (st === "failed") next = "failed";
            else if (st === "confirmed" || st === "finalized" || st === "processed")
              next = "confirmed";
          } else {
            const st = await pollEvmStatus(chain, txHash);
            if (st === "failed") next = "failed";
            else if (st === "confirmed") next = "confirmed";
          }
        } catch {
          hadAnyError = true;
        } finally {
          lastAttemptRef.current.set(it.id, Date.now());
          retryCountRef.current.set(it.id, attempts + 1);
        }
        if (next && !cancelled && isFocusedRef.current) {
          usePaymentsStore.getState().updateMsg(it.id, { status: next });
          try {
            (useThreads as any).getState?.().patchStatus?.(legacyPeerKey, it.id, next);
          } catch {}
          if (next === "confirmed" && !notifiedRef.current.has(it.id)) {
            notifiedRef.current.add(it.id);
            try {
              await notifyPaymentSent({
                amount: (it as any).amount,
                token: tokenTickerFromId((it as any).tokenId),
                to: (it as any).toDisplay ?? alias ?? name,
              });
            } catch {}
          }
          retryCountRef.current.delete(it.id);
          lastAttemptRef.current.delete(it.id);
        }
      }
      setSyncing(hadAnyError);
      if (!cancelled && isFocusedRef.current) {
        timer = setTimeout(loop, 1000);
      }
    };

    loop();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [items, legacyPeerKey, alias, name]);

  return syncing;
}

