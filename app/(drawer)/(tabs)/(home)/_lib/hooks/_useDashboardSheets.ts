// app/(drawer)/(tabs)/(home)/hooks/useDashboardSheets.ts
// Hook para manejar handlers relacionados con sheets

import { useCallback } from "react";
import { parsePaymentAmount } from "@/utils/dashboard/formatting";
import { formatRelativeDate } from "@/utils/dashboard/formatting";
import type { PaymentItem } from "../_dashboardShared";
import type { TxDetails } from "@/components/tx/TransactionDetailsSheet";

interface UseDashboardSheetsParams {
  openTxSheet: (tx: TxDetails) => void;
  closeTxSheet: () => void;
  tt: (key: string, defaultValue?: string) => string;
}

/**
 * Hook que centraliza handlers relacionados con sheets
 */
export function useDashboardSheets({ openTxSheet, closeTxSheet, tt }: UseDashboardSheetsParams) {
  const openTxDetails = useCallback(
    (p: PaymentItem) => {
      const parsed = parsePaymentAmount(p.amount);
      if (!parsed.success) return;

      const { dir, symbol: sym, amount: amt } = parsed;
      const locale = "en"; // TODO: obtener de i18n cuando esté disponible

      openTxSheet({
        id: p.id,
        dir,
        when: formatRelativeDate(p.date, locale, tt),
        peer: p.title,
        status: "Succeeded",
        tokenSymbol: sym,
        tokenAmount: amt,
      });
    },
    [tt, openTxSheet]
  );

  return {
    openTxDetails,
    closeTxSheet,
  };
}

// Default export to satisfy Expo Router (this file is not a route)
export default function() { return null; }

