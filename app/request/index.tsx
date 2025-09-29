// app/request/index.tsx
import { useLocalSearchParams, router } from "expo-router";
import { useEffect } from "react";

export default function RequestEntry() {
  const { to, chain, token, amount, memo, account } = useLocalSearchParams<{
    to?: string; chain?: string; token?: string; amount?: string; memo?: string; account?: string;
  }>();

  useEffect(() => {
    // Validaciones mínimas:
    if (!to || !chain || !token) {
      router.replace({ pathname: "/send" }); // fallback
      return;
    }
    router.replace({
      pathname: "/send",
      params: { to, chain, token, amount, memo, account },
    });
  }, [to, chain, token, amount, memo, account]);

  return null;
}