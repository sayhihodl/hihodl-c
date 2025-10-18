// src/send/quick/resolveQuickSend.ts
import { normalizeTokenId, TOKEN_ALLOWED_CHAINS, type ChainKey } from "@/config/sendMatrix";

/** Claves de token conocidas por la matriz. */
type TokenKey = keyof typeof TOKEN_ALLOWED_CHAINS;
type TokenId  = string;

/** Balances agregados por token -> chain. */
export type BalancesByToken = Record<TokenId, Partial<Record<ChainKey, number>>>;

/** Pares permitidos según la matriz + filtro opcional de redes del destinatario. */
function pairAllowed(tokenId: TokenId, chain: ChainKey, allowedChains?: ChainKey[]) {
  const norm = normalizeTokenId(tokenId) as TokenKey | undefined;
  const inMatrix = !!norm && (TOKEN_ALLOWED_CHAINS[norm] ?? []).includes(chain);
  const inAllowed = !allowedChains || allowedChains.includes(chain);
  return inMatrix && inAllowed;
}

/**
 * Devuelve un par válido y preferente { tokenId, chain } para Quick Send.
 * - 1) Preferido del usuario si tiene saldo en una red permitida.
 * - 2) Stables primero (USDC/USDT) en su red barata/rápida (orden dada por la matriz).
 * - 3) Mayor saldo absoluto entre pares válidos.
 */
export function resolveQuickSend(opts: {
  prefTokenId?: TokenId;
  allowedChains?: ChainKey[];   // redes que el destinatario acepta (opcional)
  balances: BalancesByToken;
}): { tokenId: TokenId; chain: ChainKey } | null {
  const { prefTokenId, allowedChains, balances } = opts;

  // ========== 1) Preferido del usuario ==========
  if (prefTokenId && balances[prefTokenId]) {
    // Ordena por saldo dentro de las chains válidas para ese token
    const best = (Object.entries(balances[prefTokenId]) as Array<[ChainKey, number]>)
      .filter(([c, v]) => pairAllowed(prefTokenId, c, allowedChains) && (v ?? 0) > 0)
      .sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0))[0];
    if (best) return { tokenId: prefTokenId, chain: best[0] as ChainKey };
  }

  // ========== 2) Stables primero (barato/rápido) ==========
  for (const stable of ["usdc", "usdt"] as TokenKey[]) {
    const allowedForStable = (TOKEN_ALLOWED_CHAINS[stable] ?? []) as ChainKey[];
    for (const c of allowedForStable) {
      const v = balances[stable]?.[c] ?? 0;
      if (v > 0 && pairAllowed(stable, c, allowedChains)) {
        return { tokenId: stable, chain: c };
      }
    }
  }

  // ========== 3) Mayor saldo absoluto entre pares válidos ==========
  let winner: { tokenId: TokenId; chain: ChainKey; amount: number } | null = null;

  for (const [t, rows] of Object.entries(balances)) {
    for (const [c, v] of Object.entries(rows || {}) as Array<[ChainKey, number]>) {
      if (!pairAllowed(t, c, allowedChains) || (v ?? 0) <= 0) continue;
      if (!winner || v > winner.amount) {
        winner = { tokenId: t, chain: c, amount: v };
      }
    }
  }

  return winner ? { tokenId: winner.tokenId, chain: winner.chain } : null;
}