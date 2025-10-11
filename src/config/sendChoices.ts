// config/sendChoices.ts
import type { ChainKey } from "@/types/send";

export const GLOBAL_ORDER: ChainKey[] = ["solana", "base", "polygon", "ethereum"];

export const TOKEN_NETWORK_ORDER: Record<string, ChainKey[]> = {
  "USDC.circle": ["solana", "base", "polygon", "ethereum"],
  "USDT.tether": ["solana", "base", "polygon", "ethereum"],
  "ETH.native":  ["base", "polygon", "ethereum"],
  "SOL.native":  ["solana"],
};

export const TOKEN_LABEL: Record<string, string> = {
  "USDC.circle": "USDC",
  "USDT.tether": "USDT",
  "ETH.native":  "ETH",
  "SOL.native":  "SOL",
};

export const shortAddr = (addr?: string) => {
  if (!addr) return "";
  const a = String(addr);
  if (a.length <= 10) return a;
  return `${a.slice(0, 6)}…${a.slice(-4)}`;
};

export type SendChoice = {
  id: string;
  label: string;
  nets: ChainKey[];
  bestNet: ChainKey;
};

// ---- helpers internos ----
const normChains = (rc: ChainKey | ChainKey[] | undefined): ChainKey[] | undefined =>
  typeof rc === "undefined" ? undefined : Array.isArray(rc) ? rc : [rc];

const baseOrderFor = (rc?: ChainKey[] | undefined): ChainKey[] =>
  (rc?.includes("solana")
    ? ["solana", "base", "polygon", "ethereum"]
    : ["base", "polygon", "ethereum", "solana"]) as ChainKey[];

// === Builder principal (acepta single o array) ===
export function buildSendChoices(
  recipientChains: ChainKey | ChainKey[] | undefined,
  allowedTokens: string[] = ["USDC.circle", "USDT.tether", "ETH.native", "SOL.native"]
): SendChoice[] {
  const rc = normChains(recipientChains);
  const order = baseOrderFor(rc);

  const normalize = (nets: ChainKey[]) =>
    nets
      .filter((n) => !rc || rc.includes(n))
      .sort((a, b) => order.indexOf(a) - order.indexOf(b));

  const out: SendChoice[] = [];
  for (const id of allowedTokens) {
    const nets = normalize(TOKEN_NETWORK_ORDER[id] ?? []);
    if (!nets.length) continue; // no intersección con el destino => no se muestra
    out.push({ id, label: TOKEN_LABEL[id], nets, bestNet: nets[0] });
  }
  return out;
}

/** Orden de redes para un token, con el mismo criterio del builder */
export function networkOrderForToken(
  tokenId: string,
  recipientChains?: ChainKey | ChainKey[]
): ChainKey[] {
  const rc = normChains(recipientChains);
  const order = baseOrderFor(rc);

  return (TOKEN_NETWORK_ORDER[tokenId] ?? [])
    .filter((n) => !rc || rc.includes(n))
    .sort((a, b) => order.indexOf(a) - order.indexOf(b));
}