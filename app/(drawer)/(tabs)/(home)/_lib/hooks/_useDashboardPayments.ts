// app/(drawer)/(tabs)/(home)/hooks/useDashboardPayments.ts
// Hook para manejar datos de payments por cuenta

import { useMemo } from "react";
import type { Account } from "@/hooks/useAccount";
import { PAYMENTS_MOCK, type PaymentItem } from "../_dashboardShared";

/**
 * Hook que retorna los payments filtrados por cuenta
 */
export function useDashboardPayments(account: Account) {
  const paymentsForAccount = useMemo<PaymentItem[]>(
    () => PAYMENTS_MOCK[account] ?? [],
    [account]
  );

  const paymentsTop = useMemo(() => paymentsForAccount.slice(0, 4), [paymentsForAccount]);
  
  const showPaymentsViewAll = paymentsForAccount.length > 4;

  return {
    paymentsForAccount,
    paymentsTop,
    showPaymentsViewAll,
  };
}

// Default export to satisfy Expo Router (this file is not a route)
export default function() { return null; }

