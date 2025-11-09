/**
 * Custom hooks for QuickSendScreen
 */
import { useMemo, useRef, useEffect, useCallback, useState } from "react";
import type { ChainKey } from "@/config/sendMatrix";
import type { AccountId, BalItem, PaymentType } from "./_QuickSendScreen.types";
import { useUserPrefs } from "@/store/userPrefs";
import { smartTokenPreselect } from "@/send/quick/smartTokenPreselect";
import { coercePair, bestChainForToken } from "@/config/sendMatrix";
import { parseRecipient } from "@/send/parseRecipient";
import { canSendFromChain } from "@/services/tokenSelectionRules";
import { diagnosePaymentIssues } from "@/services/paymentDiagnostics";

export function useBalancesSafe(): BalItem[] {
  try {
    const { useBalancesStore } = require("@/store/balances");
    return (useBalancesStore((s: any) => s.flat) ?? []) as BalItem[];
  } catch {
    return [];
  }
}

/**
 * Hook for token/chain preset logic
 */
export function useTokenPreset(
  paymentType: PaymentType,
  tokenId: string | undefined,
  chain: ChainKey | undefined,
  balances: BalItem[],
  state: { toRaw?: string; toDisplay?: string },
  patch: (updates: any) => void,
  setTokenId: (id: string) => void,
  setChain: (c: ChainKey) => void
) {
  const didPreset = useRef(false);
  const prefToken = (useUserPrefs((s) => s.defaultTokenId) || "").toLowerCase() || undefined;

  useEffect(() => {
    if (didPreset.current) return;

    // Para PIX y Mercado Pago: solo necesitamos tokenId, no chain
    if (paymentType === "pix" || paymentType === "mercado_pago") {
      if (tokenId) { didPreset.current = true; return; }

      const byToken: Record<string, number> = {};
      for (const b of balances) {
        const id = b.tokenId.toLowerCase();
        byToken[id] = (byToken[id] || 0) + (b.amount || 0);
      }

      const preferred = prefToken && byToken[prefToken] ? prefToken : null;
      const tokensByBalance = Object.entries(byToken)
        .filter(([, bal]) => bal > 0)
        .sort(([, a], [, b]) => b - a);

      const chosenToken = preferred || tokensByBalance[0]?.[0] || "usdc";
      setTokenId(chosenToken);
      patch({ tokenId: chosenToken });
      didPreset.current = true;
      return;
    }

    // Para crypto: usar smartTokenPreselect
    if (tokenId && chain) { didPreset.current = true; return; }

    const byToken: Record<string, Partial<Record<ChainKey, number>>> = {};
    for (const b of balances) {
      const id = b.tokenId.toLowerCase();
      byToken[id] = byToken[id] || {};
      byToken[id][b.chain] = (byToken[id][b.chain] ?? 0) + (b.amount || 0);
    }

    const parsed = parseRecipient(state.toRaw || state.toDisplay || "");
    const recipientKind = parsed?.kind === "hihodl" ? "hihodl" : parsed?.kind === "sol" ? "sol" : parsed?.kind === "evm" ? "evm" : undefined;
    const recipientChain = (parsed?.toChain || parsed?.resolved?.chain) as ChainKey | undefined;

    const favoriteChainByToken = useUserPrefs.getState().favoriteChainByToken;

    let recentTokenIds: string[] = [];
    let lastUsedWithRecipient: { tokenId: string; chain: ChainKey } | undefined = undefined;
    try {
      const { getRecentTokenIds, getLastUsedWithRecipient } = require("@/services/paymentBehaviorLearning");
      Promise.all([
        getRecentTokenIds().then((ids: string[]) => { recentTokenIds = ids; }).catch(() => {}),
        getLastUsedWithRecipient(state.toRaw || state.toDisplay || "").then((used: { tokenId: string; chain: ChainKey } | undefined) => { lastUsedWithRecipient = used; }).catch(() => {}),
      ]).catch(() => {});
    } catch {}

    const smartPick = smartTokenPreselect({
      prefTokenId: prefToken,
      favoriteChainByToken,
      recentTokenIds,
      recipientChain,
      balances: byToken,
      recipientKind: recipientKind as any,
      lastUsedWithRecipient,
    });

    if (smartPick) {
      const chosen = smartPick.tokenId.toLowerCase();
      const fixed = coercePair(chosen, smartPick.chain);
      setTokenId(chosen);
      setChain(fixed);
      patch({ tokenId: chosen, chain: fixed });
      didPreset.current = true;
      return;
    }

    const fallbackToken = "usdc";
    const fallbackChain = coercePair(fallbackToken, bestChainForToken(fallbackToken) as ChainKey);
    setTokenId(fallbackToken);
    setChain(fallbackChain);
    patch({ tokenId: fallbackToken, chain: fallbackChain });
    didPreset.current = true;
  }, [balances, paymentType, tokenId, chain, state.toRaw, state.toDisplay, prefToken, patch, setTokenId, setChain]);
}

/**
 * Hook for balance calculations
 */
export function useBalances(
  balances: BalItem[],
  tokenId: string | undefined,
  chain: ChainKey | undefined,
  account: AccountId
) {
  const balanceForSel = useMemo(() => {
    if (!tokenId || !chain || !account) return 0;
    return balances.find(b =>
      b.tokenId.toLowerCase() === tokenId &&
      b.chain === chain &&
      b.account === account
    )?.amount ?? 0;
  }, [balances, tokenId, chain, account]);

  const balanceByChain = useMemo(() => {
    if (!tokenId) return {} as Partial<Record<ChainKey, number>>;
    const byChain: Partial<Record<ChainKey, number>> = {};
    for (const b of balances) {
      if (b.tokenId.toLowerCase() === tokenId) {
        byChain[b.chain] = (byChain[b.chain] || 0) + (b.amount || 0);
      }
    }
    return byChain;
  }, [balances, tokenId]);

  const balancesForDiagnostics = useMemo(() => {
    const formatted: Record<string, Record<ChainKey, number>> = {};
    for (const b of balances) {
      const id = b.tokenId.toLowerCase();
      if (!formatted[id]) formatted[id] = {} as Record<ChainKey, number>;
      formatted[id][b.chain] = (formatted[id][b.chain] || 0) + (b.amount || 0);
    }
    return formatted;
  }, [balances]);

  return { balanceForSel, balanceByChain, balancesForDiagnostics };
}

/**
 * Hook for payment validation and diagnostics
 */
export function usePaymentValidation(
  paymentType: PaymentType,
  tokenId: string | undefined,
  chain: ChainKey | undefined,
  amount: number,
  balanceByChain: Partial<Record<ChainKey, number>>,
  balanceForSel: number,
  balancesForDiagnostics: Record<string, Record<ChainKey, number>>,
  state: { toRaw?: string; toDisplay?: string },
  title: string
) {
  const sendCheck = useMemo(() => {
    if (paymentType !== "crypto" || !tokenId || !chain || !amount) {
      return { canSend: paymentType === "pix" || paymentType === "mercado_pago" ? true : false };
    }
    try {
      const balanceByChainTyped = balanceByChain as Partial<Record<ChainKey, number>>;
      const fullBalanceByChain: Record<ChainKey, number> = {
        solana: balanceByChainTyped.solana ?? 0,
        base: balanceByChainTyped.base ?? 0,
        polygon: balanceByChainTyped.polygon ?? 0,
        ethereum: balanceByChainTyped.ethereum ?? 0,
      };
      const userBalancesFormatted: Record<string, Record<ChainKey, number>> = {};
      userBalancesFormatted[tokenId.toLowerCase()] = fullBalanceByChain;
      return canSendFromChain(tokenId.toUpperCase(), chain, amount, userBalancesFormatted);
    } catch {
      return { canSend: balanceForSel >= amount };
    }
  }, [paymentType, tokenId, chain, amount, balanceByChain, balanceForSel]);

  const diagnostic = useMemo(() => {
    return diagnosePaymentIssues({
      tokenId,
      chain,
      amount,
      userBalances: balancesForDiagnostics,
      recipient: state.toRaw || state.toDisplay || title,
      hasNetworkConnection: true,
      pendingTxCount: 0,
    });
  }, [tokenId, chain, amount, balancesForDiagnostics, state.toRaw, state.toDisplay, title]);

  const hasAutoBridge = useMemo(() => {
    if (!tokenId || !chain || !amount) return false;
    const tokenKey = tokenId.toLowerCase();
    const balancesByChain = balancesForDiagnostics[tokenKey] || {};
    const totalBalance = Object.values(balancesByChain).reduce((sum, bal) => sum + (bal ?? 0), 0);
    const feePct = chain === "solana" ? 0.001 : chain === "base" ? 0.002 : 0.003;
    const required = amount * (1 + feePct);

    const balanceOnChain = balancesByChain[chain] ?? 0;
    return totalBalance >= required && balanceOnChain < required && diagnostic.metadata?.autoBridgePlan;
  }, [tokenId, chain, amount, balancesForDiagnostics, diagnostic.metadata]);

  return { sendCheck, diagnostic, hasAutoBridge };
}

/**
 * Hook for amount input handling
 */
export function useAmountInput(initialAmount: string) {
  const [amountStr, setAmountStr] = useState<string>(initialAmount);

  const amount = useMemo(
    () => Number((amountStr || "0").replace(",", ".")) || 0,
    [amountStr]
  );

  const appendKey = useCallback((k: string) => {
    setAmountStr((prev) => {
      let s = String(prev || "");
      if (k === ".") {
        if (!s.includes(".")) s = s ? `${s}.` : "0.";
      } else {
        s = (s === "0" ? "" : s) + k;
      }
      const [i, d] = s.split(".");
      return d ? `${i}.${d.slice(0, 6)}` : i;
    });
  }, []);

  const addPreset = useCallback((n: number, maxBalance?: number) => {
    if (n === Number.POSITIVE_INFINITY) {
      setAmountStr(String(maxBalance || 0));
      return;
    }
    setAmountStr(String(n));
  }, []);

  const backspace = useCallback(() => {
    setAmountStr((prev) => (prev ? prev.slice(0, -1) : ""));
  }, []);

  return { amountStr, setAmountStr, amount, appendKey, addPreset, backspace };
}

/**
 * Hook to detect if recipient is HiHODL user
 */
export function useIsHihodlUser(state: { toRaw?: string; toDisplay?: string }) {
  return useMemo(() => {
    const toHandle = state.toRaw || state.toDisplay || "";
    if (!toHandle) return false;

    try {
      const parsed = parseRecipient(toHandle);
      if (!parsed) return false;

      return (
        parsed.kind === "hihodl" ||
        parsed.kind === "email" ||
        parsed.kind === "phone" ||
        parsed.kind === "iban"
      );
    } catch {
      if (toHandle.startsWith("@") || toHandle.includes("@")) return true;
      if (toHandle.length < 40 && !/^0x[a-fA-F0-9]{40}$/.test(toHandle)) return true;
      return false;
    }
  }, [state.toRaw, state.toDisplay]);
}

// Default export to satisfy Expo Router (this file is not a route)
export default function() { return null; }

