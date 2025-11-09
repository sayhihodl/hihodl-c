// src/utils/dashboard/formatting.ts
// Helpers para formateo de fechas y cantidades

import type { TFunction } from "i18next";

/**
 * Formatea una fecha de forma relativa ("Today", "Yesterday", o fecha específica)
 */
export function formatRelativeDate(
  date: string | Date,
  locale: string,
  t: TFunction
): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  
  const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
  
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  
  const timeText = new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
  
  if (isSameDay(d, now)) {
    return `${t("dashboard:dates.today", { defaultValue: "Today" })}, ${timeText}`;
  }
  
  if (isSameDay(d, yesterday)) {
    return `${t("dashboard:dates.yesterday", { defaultValue: "Yesterday" })}, ${timeText}`;
  }
  
  const dateText = new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "short",
  }).format(d);
  
  return `${dateText}, ${timeText}`;
}

/**
 * Parsea un string de cantidad de pago (ej: "+ USDT 19.00" o "- USDC 124.24")
 * @returns Objeto con dirección, símbolo y monto, o error
 */
export function parsePaymentAmount(raw: string): {
  success: true;
  dir: "in" | "out";
  symbol: string;
  amount: number;
} | {
  success: false;
  error: string;
} {
  const match = raw.match(/^([+-])\s*([A-Z]+)\s+([\d.,]+)/);
  
  if (!match) {
    return {
      success: false,
      error: "Invalid payment amount format",
    };
  }
  
  const [, sign, symbol, amountStr] = match;
  const signValue = sign === "-" ? -1 : 1;
  const amount = signValue * parseFloat(amountStr.replace(",", ""));
  
  return {
    success: true,
    dir: signValue >= 0 ? "in" : "out",
    symbol,
    amount,
  };
}

