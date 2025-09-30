// lib/solanapay.ts
import { Share, Linking } from "react-native";
import * as Clipboard from "expo-clipboard";

/* ======================= Constantes / tipos ======================= */

/** 💡 Rellena con los mints reales cuando los tengas */
export const MINTS = {
  solana: {
    usdc: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v", // USDC (mainnet)
    usdt: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11C4nD1b1L7Z5A", // USDT (mainnet)
    sol: "So11111111111111111111111111111111111111112",   // Wrapped SOL (WSOL)
  },
} as const;

export type ChainKey = "solana" | "ethereum" | "base" | "polygon" | "bitcoin" | "sui";

export type SolanaPayInput = {
  recipient: string;        // base58
  amount?: string;          // "12.34" (string para evitar localización)
  mint?: string;            // spl-token mint
  label?: string;
  message?: string;
  memo?: string;
  /** timestamps ISO8601 opcional si quieres caducidad en tu gateway */
  expires?: string;
  /** callback (webhook/return url) gestionado por tu backend */
  callback?: string;
  /** referencias opcionales (1..n) */
  reference?: string[];     // Pubkeys base58 como strings
};

export type SolanaPayData = {
  recipient: string;
  amount?: string;
  splToken?: string;
  label?: string;
  message?: string;
  memo?: string;
  reference?: string[];
};

/* ======================= Utils base58 / normalización ======================= */

const RE_SOL = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

export function isBase58Sol(addr: string) {
  return RE_SOL.test(addr.trim());
}

/** Normaliza "solana://..." -> "solana:" y trimea espacios */
function normalizeSolanaUrl(raw: string) {
  return raw.trim().replace(/^solana:\/\//i, "solana:");
}

/* ======================= Builder (directo/gateway) ======================= */

/**
 * Crea un URL Solana Pay estándar: `solana:<recipient>?...`
 * Compatible con wallets (Phantom, Solflare, etc.)
 */
export function makeSolanaPayDirect(i: SolanaPayInput): string {
  if (!isBase58Sol(i.recipient)) throw new Error("Invalid recipient");
  const qs = new URLSearchParams();
  if (i.amount) qs.set("amount", i.amount);
  if (i.mint) qs.set("spl-token", i.mint);
  if (i.label) qs.set("label", i.label);
  if (i.message) qs.set("message", i.message);
  if (i.memo) qs.set("memo", i.memo);
  if (i.reference?.length) i.reference.forEach((r) => qs.append("reference", r));
  const q = qs.toString();
  return `solana:${i.recipient}${q ? `?${q}` : ""}`;
}

/**
 * Crea un URL Solana Pay con gateway propio: `solana:https://pay.hihodl.app/pay?...`
 * Útil si quieres mediar, añadir expiración/callback/anti-fraude, etc.
 */
export function makeSolanaPayGateway(i: SolanaPayInput, base = "https://pay.hihodl.app/pay"): string {
  const qs = new URLSearchParams({ recipient: i.recipient });
  if (i.amount) qs.set("amount", i.amount);
  if (i.mint) qs.set("spl-token", i.mint);
  if (i.label) qs.set("label", i.label);
  if (i.message) qs.set("message", i.message);
  if (i.memo) qs.set("memo", i.memo);
  if (i.expires) qs.set("expires", i.expires);
  if (i.callback) qs.set("callback", i.callback);
  if (i.reference?.length) i.reference.forEach((r) => qs.append("reference", r));
  return `solana:${base}?${qs.toString()}`;
}

/** API “única”: por defecto directo; pasa { mode: "gateway" } para gateway */
export function makeSolanaPayUrl(i: SolanaPayInput, opts?: { mode?: "direct" | "gateway"; base?: string }) {
  return (opts?.mode ?? "direct") === "gateway"
    ? makeSolanaPayGateway(i, opts?.base)
    : makeSolanaPayDirect(i);
}

/** Memo de conveniencia */
export const newMemo = (): string =>
  "REQ_" + Math.random().toString(36).slice(2, 7) + Date.now().toString(36);

/* ======================= Parser (directo / gateway / https) ======================= */

/**
 * Parsea:
 *  - `solana:<recipient>?amount=...&spl-token=...`
 *  - `solana:https://pay.hihodl.app/pay?...`
 *  - `https://pay.hihodl.app/pay?...`   (por si te llega desde fuera)
 */
export function parseSolanaPayUrl(raw: string): SolanaPayData | null {
  try {
    const s = normalizeSolanaUrl(raw);
    if (s.startsWith("solana:")) {
      const after = s.slice("solana:".length);
      // Caso 1: directo → path = recipient
      if (!after.startsWith("http://") && !after.startsWith("https://")) {
        const url = new URL(`solana:${after}`);
        const recipient = url.pathname.replace(/^\//, "") || url.host || "";
        if (!recipient || !isBase58Sol(recipient)) return null;
        const p = url.searchParams;
        const data: SolanaPayData = { recipient };
        if (p.get("amount")) data.amount = p.get("amount") || undefined;
        if (p.get("spl-token")) data.splToken = p.get("spl-token") || undefined;
        if (p.get("label")) data.label = p.get("label") || undefined;
        if (p.get("message")) data.message = p.get("message") || undefined;
        if (p.get("memo")) data.memo = p.get("memo") || undefined;
        const refs = p.getAll("reference");
        if (refs.length) data.reference = refs;
        return data;
      }
      // Caso 2: gateway → tras 'solana:' hay un https...
      const url = new URL(after);
      const p = url.searchParams;
      const recipient = p.get("recipient") || "";
      if (!recipient || !isBase58Sol(recipient)) return null;
      const data: SolanaPayData = { recipient };
      if (p.get("amount")) data.amount = p.get("amount") || undefined;
      if (p.get("spl-token")) data.splToken = p.get("spl-token") || undefined;
      if (p.get("label")) data.label = p.get("label") || undefined;
      if (p.get("message")) data.message = p.get("message") || undefined;
      if (p.get("memo")) data.memo = p.get("memo") || undefined;
      const refs = p.getAll("reference");
      if (refs.length) data.reference = refs;
      return data;
    } else if (s.startsWith("http://") || s.startsWith("https://")) {
      // Caso 3: https plano de tu gateway
      const url = new URL(s);
      const p = url.searchParams;
      const recipient = p.get("recipient") || "";
      if (!recipient || !isBase58Sol(recipient)) return null;
      const data: SolanaPayData = { recipient };
      if (p.get("amount")) data.amount = p.get("amount") || undefined;
      if (p.get("spl-token")) data.splToken = p.get("spl-token") || undefined;
      if (p.get("label")) data.label = p.get("label") || undefined;
      if (p.get("message")) data.message = p.get("message") || undefined;
      if (p.get("memo")) data.memo = p.get("memo") || undefined;
      const refs = p.getAll("reference");
      if (refs.length) data.reference = refs;
      return data;
    }
    return null;
  } catch {
    return null;
  }
}

/* ======================= Share / deep link helpers ======================= */

export type PaymentRequestPayload = {
  url: string;         // comparte el https (aunque sea envuelto en solana:)
  amount?: string;
  tokenId?: "usdc" | "usdt" | "sol" | "eth" | "btc" | "sui";
  chain: ChainKey;
  memo?: string;
  note?: string;
};

/**
 * Smart Share: utiliza el sheet nativo y, si se cancela o falla, copia el link al clipboard.
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

/** Comprueba si Phantom (o wallets que reutilizan el esquema) está disponible */
export async function canOpenPhantom(): Promise<boolean> {
  try {
    return await Linking.canOpenURL("phantom://");
  } catch {
    return false;
  }
}

/**
 * Intenta abrir el deep link directamente en Phantom si está instalado.
 * En caso contrario, retorna false (para que abras el https o muestres share).
 */
export async function openInPhantom(deepLinkOrSolanaUrl: string): Promise<boolean> {
  try {
    const ok = await canOpenPhantom();
    if (!ok) return false;
    // Phantom entiende tanto `solana:...` como `https://phantom.app/ul/...`
    await Linking.openURL(deepLinkOrSolanaUrl);
    return true;
  } catch {
    return false;
  }
}

/* ======================= Validación rápida antes de enviar ======================= */

export function validateSolanaPayData(d: SolanaPayData): { ok: true } | { ok: false; reason: string } {
  if (!d?.recipient || !isBase58Sol(d.recipient)) return { ok: false, reason: "Invalid recipient" };
  if (d.amount && !/^\d+(\.\d+)?$/.test(d.amount)) return { ok: false, reason: "Invalid amount" };
  if (d.splToken && !isBase58Sol(d.splToken)) return { ok: false, reason: "Invalid spl-token mint" };
  if (d.reference && d.reference.some((r) => !isBase58Sol(r))) return { ok: false, reason: "Invalid reference key" };
  return { ok: true };
}