export type ChainKey =
  | "solana" | "ethereum" | "polygon" | "bsc" | "base" | "avalanche"
  | "tron" | "algorand" | "sui" | "uniswap" | "chainlink" | "hihodl";

export type RecipientKind =
  | "hihodl" | "phone" | "email" | "evm" | "sol" | "tron" | "ens" | "iban";

export type ParsedRecipient = {
  kind: RecipientKind;
  toRaw: string;
  toChain?: ChainKey;
  resolved?: { address?: string; chain?: ChainKey };
  display?: string;
  error?: string;
};

// ✅ Unificación en minúsculas
export type Account = "daily" | "savings" | "social";
export const ACCOUNTS = ["daily", "savings", "social"] as const;

// Normalizador seguro (case-insensitive) -> Account
export function toAccount(v: unknown): Account {
  const s = typeof v === "string" ? v.toLowerCase() : "";
  return (ACCOUNTS as readonly string[]).includes(s) ? (s as Account) : "daily";
}

export type RecentItem = {
  id: string;
  displayName: string;
  type: RecipientKind;
  raw: string;
  lastNetwork?: ChainKey;
  lastToken?: string;
  lastAmount?: number;
  lastAt: string; // ISO
  meta?: { nickname?: string; ensAvatar?: string; note?: string };
};