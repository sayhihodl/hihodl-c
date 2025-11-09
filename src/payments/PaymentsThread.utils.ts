/**
 * Utility functions for PaymentsThread
 */
import type { RecipientKind } from "@/send/types";
import type { AnyMsg } from "./PaymentsThread.types";

// Safe helpers
const lc = (s?: string) => (typeof s === "string" ? s.toLowerCase() : "");
const safeLocale = () => {
  try {
    const l =
      (typeof Intl !== "undefined" &&
        typeof Intl.DateTimeFormat === "function" &&
        new Intl.DateTimeFormat().resolvedOptions().locale) ||
      undefined;
    return l || "en-US";
  } catch {
    return "en-US";
  }
};

export const fmtAmount = (n?: number, max = 6) => {
  const v = Number(n);
  return Number.isFinite(v)
    ? v.toLocaleString(undefined, { maximumFractionDigits: max })
    : "0";
};

export function dayLabelFromEpoch(ms: number | undefined): string {
  if (!ms) return "Hoy";
  const d = new Date(ms);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const that = new Date(d);
  that.setHours(0, 0, 0, 0);
  const diff = Math.round((today.getTime() - that.getTime()) / 86400000);
  if (diff === 0) return "Hoy";
  if (diff === 1) return "Ayer";
  return d.toLocaleDateString(safeLocale(), { day: "2-digit", month: "short" });
}

export function isFirstOfDay(list: AnyMsg[], idx: number): boolean {
  if (idx === 0) return true;
  return dayLabelFromEpoch(list[idx].ts) !== dayLabelFromEpoch(list[idx - 1].ts);
}

export function tokenTickerFromId(tokenId?: string): string {
  const base = (tokenId || "usdc").split(".")[0] || "usdc";
  return base.toUpperCase();
}

export function fmtTime(ms?: number): string {
  if (!ms) return "";
  const d = new Date(ms);
  return d.toLocaleTimeString(safeLocale(), { hour: "2-digit", minute: "2-digit" });
}

export function timeAgo(ms?: number): string {
  if (!ms) return "";
  const now = Date.now();
  const diff = Math.max(0, now - ms);
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d`;
  const w = Math.floor(d / 7);
  if (w < 4) return `${w}w`;
  const mo = Math.floor(d / 30);
  if (mo < 12) return `${mo}mo`;
  const y = Math.floor(d / 365);
  return `${y}y`;
}

export function statusBadgeText(s: AnyMsg["status"] | "cancelled"): string {
  switch (s) {
    case "pending":
      return "Pending";
    case "confirmed":
      return "Confirmed";
    case "failed":
      return "Failed";
    case "canceled":
    case "cancelled":
      return "Cancelled";
    default:
      return String(s);
  }
}

export function explorerUrl(chain?: string, txHash?: string): string | undefined {
  const h = String(txHash || "").trim();
  if (!h) return undefined;
  const c = (chain || "").toLowerCase();
  if (c.includes("sol")) return `https://solscan.io/tx/${h}`;
  if (c.includes("base")) return `https://basescan.org/tx/${h}`;
  if (c.includes("eth")) return `https://etherscan.io/tx/${h}`;
  if (c.includes("poly") || c.includes("matic")) return `https://polygonscan.com/tx/${h}`;
  return undefined;
}

export function chainIdFromStr(chain?: string, mapChainKeyToChainId?: (key: any) => string | undefined): string | undefined {
  const lc = (s?: string) => (typeof s === "string" ? s.toLowerCase() : "");
  const key = lc(chain) || "sol";
  if (mapChainKeyToChainId) {
    return mapChainKeyToChainId(key as any);
  }
  // Fallback mapping if function not provided
  switch (key) {
    case "ethereum": return "eip155:1";
    case "polygon": return "eip155:137";
    case "solana": return "solana:mainnet";
    case "base": return "eip155:8453";
    default: return undefined;
  }
}

/** Formatea el nombre de display según el tipo de destinatario */
export function formatThreadDisplayName(
  name?: string,
  alias?: string,
  recipientKind?: RecipientKind | "group" | "card",
  recipientAddress?: string
): string {
  if (recipientKind === "group") {
    return name || alias || "Group";
  }

  if (recipientKind === "hihodl" || (alias && alias.startsWith("@"))) {
    return alias || name || "@user";
  }

  if (recipientKind === "evm" || recipientKind === "sol" || recipientKind === "tron") {
    const addr = recipientAddress || alias || name || "";
    if (addr.length > 10) {
      const head = addr.slice(0, 6);
      const tail = addr.slice(-4);
      return `Wallet • ${head}...${tail}`;
    }
    return `Wallet • ${addr}`;
  }

  if (recipientKind === "iban") {
    const iban = recipientAddress || alias || name || "";
    if (iban.length > 8) {
      const country = iban.slice(0, 2);
      const last4 = iban.slice(-4);
      return `IBAN • ${country}...${last4}`;
    }
    return `IBAN • ${iban}`;
  }

  if (recipientKind === "card") {
    const card = recipientAddress || alias || name || "";
    if (card.length >= 4) {
      const last4 = card.slice(-4);
      return `Card • •••• ${last4}`;
    }
    return `Card • ${card}`;
  }

  return name || alias || "@user";
}

