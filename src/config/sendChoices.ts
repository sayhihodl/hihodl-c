// config/sendChoices.ts
import type { ChainKey } from "@/types/send";

/** Orden global por defecto cuando no hay restricciones del destinatario */
export const GLOBAL_ORDER: ChainKey[] = ["solana", "base", "polygon", "ethereum"];

/** Red “preferida” por token (las que sabemos que funcionan bien hoy) */
export const TOKEN_NETWORK_ORDER: Record<string, ChainKey[]> = {
  "USDC.circle": ["solana", "base", "polygon", "ethereum"],
  "USDT.tether": ["solana", "base", "polygon", "ethereum"],
  "ETH.native":  ["base", "polygon", "ethereum"],
  "SOL.native":  ["solana"],
};

/** Etiqueta corta a mostrar en UI */
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
  id: string;        // "USDC.circle"
  label: string;     // "USDC"
  nets: ChainKey[];  // redes en orden de preferencia, ya filtradas por recipient
  bestNet: ChainKey; // primera de nets
};

/** Extensión con soporte/razón para la UI */
export type SendChoiceExt = SendChoice & {
  supported: boolean;
  reason?: "unsupported_chain" | "needs_meta"; // por qué no es seleccionable
};

type BuildOpts = {
  /** Lista blanca de tokens permitidos en este build */
  allowedTokens?: string[];
  /**
   * Conjunto de redes activadas por la app (lo que *sí* soportamos hoy).
   * Si se omite, asumimos GLOBAL_ORDER como universo y no marcamos “unsupported_chain”.
   */
  appSupportedChains?: ChainKey[];
  /**
   * Callback para decirnos si tenemos metadata suficiente para ese token+red
   * (direcciones/decimals). Si no está, no marcamos “needs_meta”.
   */
  hasMeta?: (tokenId: string, net: ChainKey) => boolean;
};

// ---- helpers internos ----
const normChains = (rc: ChainKey | ChainKey[] | undefined): ChainKey[] | undefined =>
  typeof rc === "undefined" ? undefined : Array.isArray(rc) ? rc : [rc];

const baseOrderFor = (rc?: ChainKey[] | undefined): ChainKey[] =>
  (rc?.includes("solana")
    ? ["solana", "base", "polygon", "ethereum"]
    : ["base", "polygon", "ethereum", "solana"]) as ChainKey[];

/** Filtra y ordena redes por preferencia y por recipient */
const normalizeNets = (nets: ChainKey[], rc?: ChainKey[]): ChainKey[] => {
  const order = baseOrderFor(rc);
  return nets
    .filter((n) => !rc || rc.includes(n))
    .sort((a, b) => order.indexOf(a) - order.indexOf(b));
};

/** === Builder principal (acepta single o array) === */
export function buildSendChoices(
  recipientChains: ChainKey | ChainKey[] | undefined,
  opts: BuildOpts = {}
): SendChoiceExt[] {
  const {
    allowedTokens = ["USDC.circle", "USDT.tether", "ETH.native", "SOL.native"],
    appSupportedChains, // p.ej. ["solana","base","polygon","ethereum"] pero puedes pasar menos si apagas una red
    hasMeta,
  } = opts;

  const rc = normChains(recipientChains);

  const out: SendChoiceExt[] = [];

  for (const id of allowedTokens) {
    const baseNets = TOKEN_NETWORK_ORDER[id] ?? [];
    const nets = normalizeNets(baseNets, rc);
    if (!nets.length) continue; // no intersección con el destino => no se muestra

    const bestNet = nets[0];
    const label = TOKEN_LABEL[id] ?? id;

    // --- lógica de soporte ---
    // 1) red soportada por la app
    let supported = true;
    let reason: SendChoiceExt["reason"];

    if (appSupportedChains && !appSupportedChains.includes(bestNet)) {
      supported = false;
      reason = "unsupported_chain";
    }

    // 2) metadata existente (si nos pasan el callback)
    if (supported && hasMeta && !hasMeta(id, bestNet)) {
      supported = false;
      reason = "needs_meta";
    }

    out.push({ id, label, nets, bestNet, supported, reason });
  }

  return out;
}

/** Obtén el orden de redes para un token, con el mismo criterio del builder */
export function networkOrderForToken(
  tokenId: string,
  recipientChains?: ChainKey | ChainKey[]
): ChainKey[] {
  const rc = normChains(recipientChains);
  return normalizeNets(TOKEN_NETWORK_ORDER[tokenId] ?? [], rc);
}