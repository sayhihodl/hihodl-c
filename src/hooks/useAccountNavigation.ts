// src/hooks/useAccountNavigation.ts
// Hook para sincronizar PagerView con parámetros de URL

import { useCallback, useEffect, useMemo, useRef } from "react";
import { router, useLocalSearchParams } from "expo-router";
import PagerView from "react-native-pager-view";
import * as Haptics from "expo-haptics";
import { useAccount, type Account, ACCOUNTS_ORDER, accountToId } from "./useAccount";

/**
 * Hook que sincroniza el PagerView de cuentas con los parámetros de URL
 * Maneja la sincronización bidireccional: URL → Pager y Pager → URL
 */
export function useAccountNavigation() {
  const { account: accountParam } = useLocalSearchParams<{ account?: string }>();
  const account = useAccount(accountParam);
  const pagerRef = useRef<PagerView>(null);
  const ignoreNextRef = useRef(false);
  
  // Índice de la cuenta actual
  const accountIndex = useMemo(
    () => Math.max(0, ACCOUNTS_ORDER.indexOf(account)),
    [account]
  );
  
  // Sincronizar URL → Pager: cuando cambia el parámetro, mover el pager
  useEffect(() => {
    const idx = ACCOUNTS_ORDER.indexOf(account);
    if (idx >= 0 && pagerRef.current) {
      ignoreNextRef.current = true;
      pagerRef.current.setPageWithoutAnimation?.(idx);
    }
  }, [account]);
  
  // Handler cuando el usuario cambia de página en el PagerView
  const handlePageSelected = useCallback((e: any) => {
    const idx = e?.nativeEvent?.position ?? 0;
    
    // Ignorar si fue un cambio programático
    if (ignoreNextRef.current) {
      ignoreNextRef.current = false;
      return;
    }
    
    const nextAccount = ACCOUNTS_ORDER[idx] ?? "Daily";
    if (nextAccount !== account) {
      router.setParams?.({ account: accountToId(nextAccount) } as any);
      void Haptics.selectionAsync();
    }
  }, [account]);
  
  return {
    account,
    accountIndex,
    pagerRef,
    handlePageSelected,
    ignoreNextRef,
  };
}

