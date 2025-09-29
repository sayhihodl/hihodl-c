// lib/solanapay.ts

import { Share, Linking } from "react-native";
import * as Clipboard from "expo-clipboard";

/** 💡 Ajusta MINTS reales */
export const MINTS = {
  solana: {
    usdc: "<USDC_MINT_SOL>", // Ej: EPjFWdd5Auf... (USDC en Solana)
    usdt: "<USDT_MINT_SOL>",
  },
} as const;

export type ChainKey = "solana" | "ethereum" | "base" | "polygon" | "bitcoin" | "sui";

export type SolanaPayInput = {
  recipient: string;
  amount?: string;    // "12.34"
  mint?: string;
  label?: string;     // "HiHODL Request"
  message?: string;   // nota
  memo?: string;      // REQ_xxx
  expires?: string;   // ISO opcional
  callback?: string;  // opcional backend
};

/**
 * Construye una URL de Solana Pay que apunta a nuestro gateway
 * compatible con wallets. Devuelve esquema `solana:` + https
 * para que Phantom/Solflare lo detecten correctamente.
 */
export function makeSolanaPayUrl(i: SolanaPayInput): string {
  const p = new URLSearchParams({ recipient: i.recipient });
  if (i.amount)   p.set("amount", i.amount);
  if (i.mint)     p.set("spl-token", i.mint);
  if (i.label)    p.set("label", i.label);
  if (i.message)  p.set("message", i.message);
  if (i.memo)     p.set("memo", i.memo);
  if (i.expires)  p.set("expires", i.expires);
  if (i.callback) p.set("callback", i.callback);
  return `solana:https://pay.hihodl.app/pay?${p.toString()}`;
}

export const newMemo = (): string =>
  "REQ_" + Math.random().toString(36).slice(2, 7) + Date.now().toString(36);

/** Payload estándar para compartir una solicitud de pago */
export type PaymentRequestPayload = {
  url: string; // siempre http(s) para compartir
  amount?: string;
  tokenId?: "usdc" | "usdt" | "sol" | "eth" | "btc" | "sui";
  chain: ChainKey;
  memo?: string;
  note?: string;
};

/**
 * Smart Share: usa el sheet nativo y, si el usuario cancela/ falla, copia el link.
 */
export async function smartShare(p: PaymentRequestPayload): Promise<void> {
  const text = p.note ? `${p.note}\n${p.url}` : p.url;
  try {
    const r = await Share.share({ message: text, url: p.url });
    if (!r || (r as any).action !== Share.sharedAction) {
      await Clipboard.setStringAsync(p.url);
    }
  } catch {
    await Clipboard.setStringAsync(p.url);
  }
}

/** Comprueba si Phantom (u otra wallet con el mismo esquema) está disponible */
export async function canOpenPhantom(): Promise<boolean> {
  try {
    return await Linking.canOpenURL("phantom://");
  } catch {
    return false;
  }
}