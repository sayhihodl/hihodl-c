// app/(drawer)/(tabs)/(home)/hooks/useTokenNavigation.ts
// Hook para manejar navegación a detalles de tokens con guards

import { useCallback, useRef, useEffect } from "react";
import { router, usePathname, type Href } from "expo-router";

/**
 * Hook que maneja la navegación a detalles de tokens con guards para evitar navegación duplicada
 */
export function useTokenNavigation() {
  const pathname = usePathname();
  const navBusyRef = useRef(false);
  const tokenNavLockRef = useRef(false);
  const lastTokenTargetRef = useRef<string | null>(null);

  // Reset locks cuando no estamos en la página de token
  useEffect(() => {
    const isToken = pathname?.startsWith("/(drawer)/(internal)/token/") || pathname?.startsWith("/(tabs)/token/");
    if (!isToken) {
      tokenNavLockRef.current = false;
      lastTokenTargetRef.current = null;
    }
  }, [pathname]);

  const guardNav = useCallback((fn: () => void) => {
    if (navBusyRef.current) return;
    navBusyRef.current = true;
    setTimeout(() => (navBusyRef.current = false), 500);
    fn();
  }, []);

  const openTokenDetails = useCallback(
    (arg: string | { id: string; chainId?: string | null; account: string }) => {
      // Parsear el tokenKey para extraer el currencyId
      let currencyId: string;
      
      if (typeof arg === "string") {
        // tokenKey está en formato "id::chainId::accountId"
        const parts = arg.split("::");
        currencyId = parts[0] || arg; // Si no hay separadores, usar el string completo
      } else {
        currencyId = arg.id;
      }
      
      const href: Href = {
        pathname: "/(drawer)/(internal)/token/[symbol]" as const,
        params: { symbol: currencyId },
      };
      
      if (pathname?.startsWith("/(drawer)/(internal)/token/")) {
        router.replace(href);
      } else {
        router.push(href);
      }
    },
    [pathname]
  );

  return { guardNav, openTokenDetails };
}

// Default export to satisfy Expo Router (this file is not a route)
export default function() { return null; }

