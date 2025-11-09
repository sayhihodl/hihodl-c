// app/(drawer)/(tabs)/(home)/hooks/useTokenPicker.ts
// Hook para manejar la lógica de selección de tokens

import { useCallback } from "react";
import type { ChainKey } from "@/config/sendMatrix";
import type { CurrencyId } from "@/store/portfolio.store";
import { accountToId } from "@/hooks/useAccount";
import type { Account } from "@/hooks/useAccount";
import { getChainId } from "@/config/chainMapping";
import { normalizeChainId } from "@/utils/dashboard/tokenHelpers";
import { buildTokenTargetKey } from "../_dashboardShared";

interface BalItem {
  tokenId: string;
  chain: string;
  amount: number;
  account: string;
}

/**
 * Hook que maneja la lógica de selección de tokens y verificación de balances
 */
export function useTokenPicker(
  account: Account,
  balances: BalItem[],
  guardNav: (fn: () => void) => void,
  openTokenDetails: (tokenKey: string) => void,
  closeAddTokenSheet: () => void,
  setSelectedTokenForAction: (action: { tokenId: string; chain: ChainKey } | null) => void
) {
  const hasTokenBalance = useCallback(
    (tokenId: string, chain: string, accountId: string): boolean => {
      const tokenKey = tokenId.toLowerCase();
      return balances.some(
        (b) =>
          b.tokenId.toLowerCase() === tokenKey &&
          b.chain === chain &&
          b.account === accountId &&
          (b.amount ?? 0) > 0
      );
    },
    [balances]
  );

  const handleTokenPick = useCallback(
    ({ tokenId: id, chain: fixed }: { tokenId: string; chain: ChainKey }) => {
      const accountId = accountToId(account);
      const hasBalance = hasTokenBalance(id, fixed, accountId);

      if (hasBalance) {
        // Si tiene balance, abrir detalles del token
        closeAddTokenSheet();
        guardNav(() => {
          const chainId = getChainId(fixed);
          const tokenKeyBuilt = buildTokenTargetKey({
            id: id as CurrencyId,
            chainId: normalizeChainId(chainId),
            accountId,
          });
          openTokenDetails(tokenKeyBuilt);
        });
      } else {
        // Si no tiene balance, mostrar opciones
        setSelectedTokenForAction({ tokenId: id, chain: fixed });
        closeAddTokenSheet();
      }
    },
    [
      account,
      hasTokenBalance,
      closeAddTokenSheet,
      guardNav,
      openTokenDetails,
      setSelectedTokenForAction,
    ]
  );

  return { hasTokenBalance, handleTokenPick };
}

// Default export to satisfy Expo Router (this file is not a route)
export default function() { return null; }

