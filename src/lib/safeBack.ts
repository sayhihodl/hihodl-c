// lib/safeBack.ts
import { type Href, router } from "expo-router";

export function safeBack(fallback: Href) {
  try {
    // expo-router expone canGoBack en runtime
    // @ts-ignore (tipado puede variar por versión)
    if (typeof (router as any).canGoBack === "function" && (router as any).canGoBack()) {
      router.back();
      return;
    }
  } catch {}
  router.replace(fallback);
}