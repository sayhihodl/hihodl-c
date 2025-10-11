// src/types/send.ts
export type ChainKey =
  | "solana" | "ethereum" | "polygon" | "bsc" | "base" | "avalanche" | "bsc"
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