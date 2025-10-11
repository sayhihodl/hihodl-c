// src/send/types.ts
export type ChainKey =
  | "solana" | "ethereum" | "polygon" | "bsc" | "base" | "avalanche"
  | "tron" | "algorand" | "sui" | "uniswap" | "chainlink" | "hihodl";

export type RecipientKind =
  | "hihodl" | "phone" | "email" | "evm" | "sol" | "tron" | "ens" | "iban";

export type ParsedRecipient = {
  kind: RecipientKind;
  toRaw: string;
  // cuando aplique
  toChain?: ChainKey;
  resolved?: { // p.ej. ENS -> 0x..., alias -> wallet(s)
    address?: string;
    chain?: ChainKey;
  };
  display?: string;    // apodo/alias/short
  error?: string;      // si el input parece válido pero falla la validación extra
};
export type Account = "Daily" | "Savings" | "Social";
export type RecentItem = {
  id: string; // uid local
  displayName: string;
  type: RecipientKind;
  raw: string;
  lastNetwork?: ChainKey;
  lastToken?: string;     // "USDC" | "ETH"…
  lastAmount?: number;
  lastAt: string;         // ISO
  meta?: { nickname?: string; ensAvatar?: string; note?: string };
};