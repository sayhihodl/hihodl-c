// src/send/quick/smartTokenPreselect.ts
// Auto-selección inteligente de token para envíos rápidos entre usuarios HiHODL
import type { ChainKey } from "@/config/sendMatrix";
import { TOKEN_ALLOWED_CHAINS, normalizeTokenId, bestChainForToken } from "@/config/sendMatrix";

// Importar sistema de aprendizaje (async, no bloquea)
let getLastUsedWithRecipient: ((recipient?: string) => Promise<{ tokenId: string; chain: ChainKey } | undefined>) | undefined;
let getRecentTokenIds: (() => Promise<string[]>) | undefined;

try {
  const learning = require("@/services/paymentBehaviorLearning");
  getLastUsedWithRecipient = learning.getLastUsedWithRecipient;
  getRecentTokenIds = learning.getRecentTokenIds;
} catch {
  // Sistema de aprendizaje no disponible, usar fallbacks
}

export type BalancesByToken = Record<string, Partial<Record<ChainKey, number>>>;

export type TokenPreselectContext = {
  prefTokenId?: string;                    // Token favorito del usuario (defaultTokenId)
  favoriteChainByToken?: Record<string, ChainKey>; // Chain favorita por token
  recentTokenIds?: string[];               // Tokens usados recientemente
  recipientChain?: ChainKey;              // Chain preferida del destinatario
  balances: BalancesByToken;              // Balances del usuario
  recipientKind?: "hihodl" | "evm" | "sol" | "tron"; // Tipo de destinatario
  lastUsedWithRecipient?: { tokenId: string; chain: ChainKey }; // Último token usado con este destinatario
};

/**
 * Auto-selecciona el mejor token+chain para envío rápido entre usuarios HiHODL.
 * 
 * PRIORIDADES (ordenadas por importancia para maximizar velocidad y UX):
 * 
 * 1. Token favorito del usuario SI tiene balance suficiente
 * 2. Último token usado con este destinatario (si existe y tiene balance)
 * 3. Token más usado recientemente (de los últimos 3) con balance
 * 4. Si token favorito no tiene balance → mismo token en otra chain (chain favorita del usuario o más barata)
 * 5. Token con más balance total (liquidez máxima)
 * 6. Chain favorita del usuario para tokens con balance (preferencia explícita)
 * 7. Token nativo de la chain del destinatario (SOL en Solana, ETH en Ethereum/Base)
 * 8. Stablescoins en la chain del destinatario (mayor compatibilidad)
 * 9. Stablescoins en chain más barata/rápida si destinatario acepta múltiples chains
 * 10. Token más popular en la chain del destinatario
 * 11. Fallback: USDC en la mejor chain disponible
 */
export function smartTokenPreselect(context: TokenPreselectContext): {
  tokenId: string;
  chain: ChainKey;
} | null {
  const {
    prefTokenId,
    favoriteChainByToken,
    recentTokenIds = [],
    recipientChain,
    balances,
    recipientKind,
    lastUsedWithRecipient,
  } = context;

  // Helper: verificar si un token tiene balance en una chain
  const hasBalance = (tokenId: string, chain: ChainKey): boolean => {
    return (balances[tokenId.toLowerCase()]?.[chain] ?? 0) > 0;
  };

  // Helper: obtener balance en una chain
  const getBalance = (tokenId: string, chain: ChainKey): number => {
    return balances[tokenId.toLowerCase()]?.[chain] ?? 0;
  };

  // Helper: obtener todas las chains con balance para un token
  const getChainsWithBalance = (tokenId: string): Array<[ChainKey, number]> => {
    const tokenBalances = balances[tokenId.toLowerCase()] || {};
    return (Object.entries(tokenBalances) as Array<[ChainKey, number]>)
      .filter(([, bal]) => (bal ?? 0) > 0)
      .sort(([, a], [, b]) => (b ?? 0) - (a ?? 0));
  };

  // Helper: priorizar chain (recipientChain > favoriteChain > más barata)
  const prioritizeChain = (chains: ChainKey[], tokenId: string): ChainKey => {
    // 1. Chain del destinatario si existe y tiene balance
    if (recipientChain && chains.includes(recipientChain)) {
      return recipientChain;
    }
    
    // 2. Chain favorita del usuario para este token
    const favoriteChain = favoriteChainByToken?.[tokenId.toLowerCase()];
    if (favoriteChain && chains.includes(favoriteChain)) {
      return favoriteChain;
    }
    
    // 3. Chain más barata/rápida (Solana > Base > Polygon > Ethereum)
    const speedOrder: ChainKey[] = ["solana", "base", "polygon", "ethereum"];
    for (const chain of speedOrder) {
      if (chains.includes(chain)) {
        return chain;
      }
    }
    
    // 4. Primera disponible
    return chains[0];
  };

  // ========== 1) Token favorito SI tiene balance ==========
  if (prefTokenId) {
    const prefKey = prefTokenId.toLowerCase();
    const chainsWithBalance = getChainsWithBalance(prefKey);
    
    if (chainsWithBalance.length > 0) {
      const chosenChain = prioritizeChain(chainsWithBalance.map(c => c[0]), prefKey);
      return { tokenId: prefKey, chain: chosenChain };
    }
    
    // Si no tiene balance en favorito → buscar mismo token en otras chains (prioridad 4)
    const allowedChains = TOKEN_ALLOWED_CHAINS[normalizeTokenId(prefKey) as keyof typeof TOKEN_ALLOWED_CHAINS];
    if (allowedChains && allowedChains.length > 1) {
      const favoriteChain = favoriteChainByToken?.[prefKey];
      const bestChain = favoriteChain && allowedChains.includes(favoriteChain)
        ? favoriteChain
        : bestChainForToken(prefKey, recipientChain ? [recipientChain] : undefined) || allowedChains[0];
      return { tokenId: prefKey, chain: bestChain };
    }
  }

  // ========== 2) Último token usado con este destinatario ==========
  if (lastUsedWithRecipient) {
    const { tokenId, chain } = lastUsedWithRecipient;
    const tokenKey = tokenId.toLowerCase();
    
    if (hasBalance(tokenKey, chain)) {
      return { tokenId: tokenKey, chain };
    }
    
    // Si no tiene balance en esa chain, buscar en otras chains del mismo token
    const chainsWithBalance = getChainsWithBalance(tokenKey);
    if (chainsWithBalance.length > 0) {
      return { tokenId: tokenKey, chain: prioritizeChain(chainsWithBalance.map(c => c[0]), tokenKey) };
    }
  }

  // ========== 3) Token más usado recientemente (de los últimos 3) con balance ==========
  const recentWithBalance = recentTokenIds
    .slice(0, 3) // Solo los 3 más recientes
    .map(id => id.toLowerCase())
    .filter(id => {
      const chainsWithBal = getChainsWithBalance(id);
      return chainsWithBal.length > 0;
    });

  if (recentWithBalance.length > 0) {
    const recentTokenId = recentWithBalance[0];
    const chainsWithBalance = getChainsWithBalance(recentTokenId);
    const chosenChain = prioritizeChain(chainsWithBalance.map(c => c[0]), recentTokenId);
    return { tokenId: recentTokenId, chain: chosenChain };
  }

  // ========== 5) Token con más balance total ==========
  let bestByBalance: { tokenId: string; chain: ChainKey; total: number } | null = null;
  
  for (const [tokenId, byChain] of Object.entries(balances)) {
    const total = Object.values(byChain || {}).reduce((sum, bal) => sum + (bal ?? 0), 0);
    if (total <= 0) continue;
    
    const chainsWithBalance = getChainsWithBalance(tokenId);
    if (chainsWithBalance.length > 0) {
      const bestChain = prioritizeChain(chainsWithBalance.map(c => c[0]), tokenId);
      if (!bestByBalance || total > bestByBalance.total) {
        bestByBalance = { tokenId, chain: bestChain, total };
      }
    }
  }
  
  if (bestByBalance) {
    return { tokenId: bestByBalance.tokenId, chain: bestByBalance.chain };
  }

  // ========== 6) Chain favorita del usuario para tokens con balance ==========
  if (favoriteChainByToken) {
    for (const [tokenId, favoriteChain] of Object.entries(favoriteChainByToken)) {
      if (hasBalance(tokenId.toLowerCase(), favoriteChain)) {
        return { tokenId: tokenId.toLowerCase(), chain: favoriteChain };
      }
    }
  }

  // ========== 7) Token nativo de la chain del destinatario ==========
  if (recipientChain) {
    const nativeTokens: Record<ChainKey, string> = {
      solana: "sol",
      ethereum: "eth",
      base: "eth", // Base también usa ETH como nativo
      polygon: "matic",
    };
    
    const nativeToken = nativeTokens[recipientChain];
    if (nativeToken && hasBalance(nativeToken, recipientChain)) {
      return { tokenId: nativeToken, chain: recipientChain };
    }
  }

  // ========== 8) Stablescoins en la chain del destinatario ==========
  if (recipientChain) {
    for (const stable of ["usdc", "usdt"] as const) {
      const allowed = TOKEN_ALLOWED_CHAINS[stable] || [];
      if (allowed.includes(recipientChain) && hasBalance(stable, recipientChain)) {
        return { tokenId: stable, chain: recipientChain };
      }
    }
  }

  // ========== 9) Stablescoins en chain más barata/rápida ==========
  const speedOrder: ChainKey[] = ["solana", "base", "polygon", "ethereum"];
  for (const chain of speedOrder) {
    for (const stable of ["usdc", "usdt"] as const) {
      const allowed = TOKEN_ALLOWED_CHAINS[stable] || [];
      if (allowed.includes(chain) && hasBalance(stable, chain)) {
        return { tokenId: stable, chain };
      }
    }
  }

  // ========== 10) Token más popular en la chain del destinatario ==========
  if (recipientChain) {
    for (const stable of ["usdc", "usdt"] as const) {
      const allowed = TOKEN_ALLOWED_CHAINS[stable] || [];
      if (allowed.includes(recipientChain)) {
        // Incluso sin balance, preferir stables en la chain del destinatario
        return { tokenId: stable, chain: recipientChain };
      }
    }
  }

  // ========== 11) Fallback: USDC en la mejor chain disponible ==========
  const usdcChains = TOKEN_ALLOWED_CHAINS.usdc || [];
  if (usdcChains.length > 0) {
    // Priorizar: recipientChain > chain favorita > más rápida
    const favoriteChain = favoriteChainByToken?.["usdc"];
    const preferredChains = [
      ...(recipientChain && usdcChains.includes(recipientChain) ? [recipientChain] : []),
      ...(favoriteChain && usdcChains.includes(favoriteChain) ? [favoriteChain] : []),
      ...speedOrder.filter(c => usdcChains.includes(c)),
      ...usdcChains.filter(c => !speedOrder.includes(c)),
    ];
    
    const bestChain = preferredChains[0] || usdcChains[0];
    return { tokenId: "usdc", chain: bestChain };
  }

  return null;
}

