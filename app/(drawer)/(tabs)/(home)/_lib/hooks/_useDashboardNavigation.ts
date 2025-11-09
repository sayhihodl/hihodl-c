// app/(drawer)/(tabs)/(home)/hooks/useDashboardNavigation.ts
// Hook para centralizar todos los handlers de navegación del dashboard

import { useCallback } from "react";
import { router, type Href } from "expo-router";
import * as Haptics from "expo-haptics";
import type { Account } from "@/hooks/useAccount";
import { accountToId } from "@/hooks/useAccount";

/**
 * Helper para crear Href de forma type-safe
 */
const href = <P extends Record<string, string>>(
  pathname: `/${string}`,
  params?: P
): Href => ({ pathname: pathname as any, params } as unknown as Href);

/**
 * Hook que centraliza todos los handlers de navegación del dashboard
 */
export function useDashboardNavigation(account: Account) {
  const push = useCallback((p: Href) => router.navigate(p), []);

  // Acciones desde el sheet de transacción
  const onTxReceive = useCallback(
    () => router.navigate(href("/(drawer)/(internal)/receive", { account: accountToId(account) })),
    [account]
  );

  const onTxSend = useCallback(() => {
    router.navigate({
      pathname: "/(drawer)/(internal)/send",
      params: { account: accountToId(account), startAt: "search", mode: "send" },
    });
  }, [account]);

  const onTxSwap = useCallback(() => {
    router.navigate(`/(drawer)/(tabs)/swap?account=${accountToId(account)}`);
  }, [account]);

  // Accesos directos (hero actions / etc.)
  const goReceive = useCallback(
    () => router.navigate(href("/(drawer)/(internal)/receive", { account: accountToId(account) })),
    [account]
  );

  const goSwap = useCallback(
    () => router.navigate(`/(drawer)/(tabs)/swap?account=${accountToId(account)}`),
    [account]
  );

  const goCards = useCallback(() => {
    router.navigate({
      pathname: "/(drawer)/(internal)/cards/[id]",
      params: { id: "general", account: accountToId(account) },
    });
  }, [account]);

  const goPaymentsFor = useCallback(
    (acc: Account) => router.navigate(href("/(drawer)/(tabs)/payments", { account: accountToId(acc) })),
    []
  );

  const goAllTokens = useCallback(() => {
    router.navigate(href("/(drawer)/(internal)/tokens", { account: accountToId(account) }));
  }, [account]);

  const goAllActivity = useCallback(() => {
    router.navigate(href("/(drawer)/(internal)/activity", { account: accountToId(account) }));
  }, [account]);

  const openScanner = useCallback(() => {
    void Haptics.selectionAsync();
    router.push("/(drawer)/(internal)/receive/scanner" as Href);
  }, []);

  return {
    push,
    onTxReceive,
    onTxSend,
    onTxSwap,
    goReceive,
    goSwap,
    goCards,
    goPaymentsFor,
    goAllTokens,
    goAllActivity,
    openScanner,
  };
}

// Default export to satisfy Expo Router (this file is not a route)
export default function() { return null; }

