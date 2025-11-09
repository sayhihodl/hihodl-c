// src/utils/dashboard/currencyHelpers.ts
// Helpers para formateo de moneda y conversión FX

import { CURRENCIES } from "@/constants/currencies";

// Fiat ahora acepta cualquier código de moneda ISO 4217
export type Fiat = string;

/**
 * Tasas de conversión desde USD (valores aproximados)
 * TODO: En producción, obtener estas tasas de una API de FX en tiempo real
 */
export const FX_RATES: Record<string, number> = {
  USD: 1.0,
  EUR: 0.92,
  GBP: 0.79,
  JPY: 150.0,
  CNY: 7.2,
  AUD: 1.52,
  CAD: 1.35,
  CHF: 0.88,
  NZD: 1.65,
  SEK: 10.5,
  NOK: 10.8,
  DKK: 6.85,
  SGD: 1.34,
  HKD: 7.8,
  KRW: 1320.0,
  INR: 83.0,
  BRL: 5.0,
  MXN: 17.0,
  ZAR: 18.5,
  RUB: 92.0,
  // Agregar más según necesidad
};

/**
 * Obtiene la tasa de conversión desde USD a la moneda especificada
 * Si no existe, retorna 1.0 (asume 1:1, idealmente debería obtener de API)
 */
export function getFXRate(currencyCode: string): number {
  return FX_RATES[currencyCode] ?? 1.0;
}

/**
 * Crea un formateador de moneda para el locale actual
 */
export function createFiatFormatter(locale: string, currency: string) {
  // Obtener decimales de la moneda si está disponible
  const currencyInfo = CURRENCIES.find(c => c.code === currency);
  const decimals = currencyInfo?.decimals ?? 2;
  
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: decimals,
    minimumFractionDigits: decimals,
  });
}

/**
 * Formatea un monto en USD a la moneda especificada
 */
export function formatFiatAmount(
  usdAmount: number,
  locale: string,
  currency: string
): string {
  const formatter = createFiatFormatter(locale, currency);
  const rate = getFXRate(currency);
  const convertedAmount = usdAmount * rate;
  return formatter.format(convertedAmount);
}

/**
 * Obtiene el símbolo de una moneda desde CURRENCIES
 */
export function getCurrencySymbol(currencyCode: string): string {
  const currency = CURRENCIES.find(c => c.code === currencyCode);
  return currency?.symbol ?? currencyCode;
}

/**
 * Símbolos de moneda (compatibilidad hacia atrás)
 * @deprecated Usar getCurrencySymbol en su lugar
 */
export const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  JPY: "¥",
  CNY: "¥",
  AUD: "$",
  CAD: "$",
  CHF: "Fr",
  NZD: "$",
  SEK: "kr",
  NOK: "kr",
  DKK: "kr",
  SGD: "$",
  HKD: "$",
  KRW: "₩",
  INR: "₹",
  BRL: "R$",
  MXN: "$",
  ZAR: "R",
  RUB: "₽",
} as const;

