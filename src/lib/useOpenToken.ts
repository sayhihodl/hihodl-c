// lib/useOpenToken.ts
import { useCallback, useRef } from "react";
import { router, usePathname, useLocalSearchParams } from "expo-router";

type OpenTokenArgs = {
  id: string;          // CurrencyId
  chainId?: string;    // ChainId
  accountId?: string;  // "daily" | "savings" | "social"
};

export function useOpenToken() {
  const pathname = usePathname();
  const currentParams = useLocalSearchParams();
  const isNavigatingRef = useRef(false);

  const openToken = useCallback(
    async ({ id, chainId, accountId }: OpenTokenArgs) => {
      if (isNavigatingRef.current) return; // de-bounce taps rápidos
      isNavigatingRef.current = true;

      try {
        const targetPath = "/(tabs)/token/[id]";
        const sameRoute = pathname === targetPath;
        const sameId = String(currentParams?.id ?? "") === String(id ?? "");
        const sameChain =
          String(currentParams?.chainId ?? "") === String(chainId ?? "");
        const sameAccount =
          String(currentParams?.accountId ?? "") === String(accountId ?? "");

        const href = {
          pathname: targetPath as any,
          params: {
            id: String(id),
            ...(chainId ? { chainId: String(chainId) } : {}),
            ...(accountId ? { accountId: String(accountId) } : {}),
          },
        };

        if (sameRoute && sameId && sameChain && sameAccount) {
          // Ya estás en ese detalle exacto → no hagas nada
          return;
        }

        if (sameRoute) {
          // Estás en token/[id] pero cambias chain/account → REPLACE
          router.replace(href);
        } else {
          // Vienes de otra screen → PUSH/NAVIGATE
          router.push(href);
        }
      } finally {
        // libera tras un frame para no bloquear
        setTimeout(() => {
          isNavigatingRef.current = false;
        }, 0);
      }
    },
    [pathname, currentParams]
  );

  return { openToken };
}