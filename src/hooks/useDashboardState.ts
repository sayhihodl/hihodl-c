// src/hooks/useDashboardState.ts
// Hook para consolidar estado relacionado del Dashboard

import { useState, useCallback, useEffect } from "react";
import type { TxDetails } from "@/components/tx/TransactionDetailsSheet";
import type { ChainKey } from "@/config/sendMatrix";
import type { Fiat } from "@/utils/dashboard/currencyHelpers";
import type { BannerItem } from "@/store/dashboard.types";
import { useSettingsStore } from "@/store/settings";

/**
 * Estado de UI del dashboard
 */
export interface DashboardUIState {
  fiat: Fiat;
  showDust: boolean;
  isRefreshing: boolean;
}

/**
 * Estado de sheets/bottom sheets
 */
export interface DashboardSheetsState {
  tx: {
    open: boolean;
    payment: TxDetails | null;
  };
  addToken: {
    open: boolean;
  };
  tokenAction: {
    tokenId: string;
    chain: ChainKey;
  } | null;
}

/**
 * Hook que consolida todo el estado relacionado del Dashboard
 * en lugar de múltiples useState separados
 */
export function useDashboardState() {
  // Leer currency del settings store
  const currency = useSettingsStore((state) => state.currency);
  const setCurrency = useSettingsStore((state) => state.setCurrency);

  const [ui, setUI] = useState<DashboardUIState>({
    fiat: currency || "USD",
    showDust: false,
    isRefreshing: false,
  });

  // Sincronizar fiat con el currency del store cuando cambie
  useEffect(() => {
    if (currency && currency !== ui.fiat) {
      setUI(prev => ({ ...prev, fiat: currency }));
    }
  }, [currency, ui.fiat]);

  const [sheets, setSheets] = useState<DashboardSheetsState>({
    tx: { open: false, payment: null },
    addToken: { open: false },
    tokenAction: null,
  });

  const [banners, setBanners] = useState<BannerItem[]>([]);

  // Setters específicos para UI
  const setFiat = useCallback((fiat: Fiat | ((prev: Fiat) => Fiat)) => {
    const newFiat = typeof fiat === "function" ? fiat(ui.fiat) : fiat;
    setUI(prev => ({ ...prev, fiat: newFiat }));
    // También actualizar el store para persistencia
    setCurrency(newFiat);
  }, [ui.fiat, setCurrency]);

  const setShowDust = useCallback((show: boolean | ((prev: boolean) => boolean)) => {
    setUI(prev => ({ ...prev, showDust: typeof show === "function" ? show(prev.showDust) : show }));
  }, []);

  const setIsRefreshing = useCallback((refreshing: boolean) => {
    setUI(prev => ({ ...prev, isRefreshing: refreshing }));
  }, []);

  // Setters específicos para Sheets
  const openTxSheet = useCallback((payment: TxDetails) => {
    setSheets(prev => ({ ...prev, tx: { open: true, payment } }));
  }, []);

  const closeTxSheet = useCallback(() => {
    setSheets(prev => ({ ...prev, tx: { open: false, payment: null } }));
  }, []);

  const openAddTokenSheet = useCallback(() => {
    setSheets(prev => ({ ...prev, addToken: { open: true } }));
  }, []);

  const closeAddTokenSheet = useCallback(() => {
    setSheets(prev => ({ ...prev, addToken: { open: false } }));
  }, []);

  const setSelectedTokenForAction = useCallback((token: { tokenId: string; chain: ChainKey } | null) => {
    setSheets(prev => ({ ...prev, tokenAction: token }));
  }, []);

  return {
    // Estado
    ui,
    sheets,
    banners,
    
    // Setters UI
    setFiat,
    setShowDust,
    setIsRefreshing,
    
    // Setters Sheets
    openTxSheet,
    closeTxSheet,
    openAddTokenSheet,
    closeAddTokenSheet,
    setSelectedTokenForAction,
    
    // Setters Banners
    setBanners,
  };
}

