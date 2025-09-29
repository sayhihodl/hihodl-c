// src/token/coins.ts
export type PegType = "fiat" | "crypto" | "commodity" | "other";

export const STABLE_IDS = new Set<string>([
  // símbolos comunes
  "USDT", "USDC", "DAI", "TUSD", "BUSD", "FDUSD", "GUSD", "PYUSD",
  "EURT", "EURS", "EURCV", "XUSDC", "USDX", "HUSD", "XUSD",
]);

/** Heurística de nombres/slug que suelen ser stables (ej: something-USD, usd-something) */
const STABLE_HINT_RE = /\b(usd|eur|gbp|cny|aud|cad|chf)\b|(?:^|[-_])(usd|eur|gbp)(?:$|[-_])/i;

/** Determina si un currencyId es estable. Usa lista + heurística. */
export function isStableCurrency(currencyId?: string | null): boolean {
  if (!currencyId) return false;
  const id = currencyId.toUpperCase();
  if (STABLE_IDS.has(id)) return true;
  // algunos ids vienen como "usdc.ethereum" o "usd-coin"
  const slug = id.replace(/\./g, "-");
  return STABLE_HINT_RE.test(slug);
}

/** Sencillo: si NO es stable -> es volátil (BTC, SOL, etc.) */
export function isVolatile(currencyId?: string | null): boolean {
  return !!currencyId && !isStableCurrency(currencyId);
}