// src/services/tokenSelectionRules.ts
// Lógica inteligente para auto-seleccionar la mejor chain de un token
import type { ChainKey } from "@/config/sendMatrix";
import { useUserPrefs } from "@/store/userPrefs";

export type TokenSelectionContext = {
  recipientChain?: ChainKey;        // Chain del destinatario (si está disponible)
  userBalances?: Record<string, Record<ChainKey, number>>; // balances por token y chain
  userFavoriteChain?: ChainKey;     // Chain favorita del usuario (configuración)
  preferredChain?: ChainKey;        // Chain pre-seleccionada en UI
  amount?: number;                  // Amount que el usuario quiere enviar (para validar balance suficiente)
  requireBalance?: boolean;         // Si true, solo considera chains donde hay balance suficiente
};

/**
 * Estima el balance mínimo necesario considerando fees.
 * 
 * MODELO GASLESS (HiHODL):
 * - El usuario NO necesita gas nativo en ninguna chain
 * - HiHODL paga el gas por detrás (abstract layer)
 * - El usuario paga fees en el token que envía (deducido del amount)
 * - Bridge automático: si el usuario tiene USDC en Polygon y envía a Solana,
 *   HiHODL hace el bridge automáticamente sin que el usuario necesite tokens nativos
 * 
 * Esto elimina el pain de tener que tener:
 * - Gas en Polygon (para enviar)
 * - Gas en Solana (para recibir)
 * - El mismo token en múltiples chains
 */
function estimateRequiredBalance(amount: number, chain: ChainKey): number {
  if (!amount || amount <= 0) return 0;
  
  // Fee estimada en el mismo token (no necesita gas nativo gracias a gasless)
  // HiHODL cobra una pequeña fee (0.1-0.3%) del amount en el mismo token
  // Típicamente: Solana más barato, EVM chains ligeramente más costosas
  const feePct = chain === "solana" ? 0.001 : chain === "base" ? 0.002 : 0.003;
  return amount * (1 + feePct);
}

/**
 * Auto-selecciona la mejor chain para un token basado en reglas inteligentes:
 * PRIORIDAD (pensando como CTO - evitar pain del usuario):
 * 1. Chain donde el usuario tiene balance SUFICIENTE (evita bridges innecesarios)
 * 2. Chain favorita del usuario para ese token
 * 3. Chain donde el usuario tiene MÁS balance (si tiene en múltiples)
 * 4. Chain del destinatario SOLO si tiene balance suficiente (evita "insufficient balance")
 * 5. Chain preferida en UI
 * 6. Popularidad/costo
 */
export function selectBestChain(
  tokenSymbol: string,
  availableChains: ChainKey[],
  context: TokenSelectionContext = {}
): ChainKey | undefined {
  if (!availableChains.length) return undefined;
  if (availableChains.length === 1) return availableChains[0];

  const {
    recipientChain,
    userBalances,
    userFavoriteChain,
    preferredChain,
    amount = 0,
    requireBalance = true, // Por defecto, requerir balance para evitar pain
  } = context;

  const tokenKey = tokenSymbol.toLowerCase();
  const balancesByChain = userBalances?.[tokenKey];

  // Calcular balances disponibles y requeridos
  const chainData = availableChains.map(chain => {
    const balance = balancesByChain?.[chain] ?? 0;
    const required = estimateRequiredBalance(amount, chain);
    const hasEnough = balance >= required;
    const hasAny = balance > 0;
    
    return {
      chain,
      balance,
      required,
      hasEnough,
      hasAny,
      score: 0, // Calcularemos score después
    };
  });

  // Si requireBalance, filtrar solo chains con balance suficiente
  let candidates = requireBalance
    ? chainData.filter(c => c.hasEnough)
    : chainData;

  // Si no hay candidatos con balance suficiente, usar todas (pero marcar como insufficient)
  if (candidates.length === 0 && requireBalance) {
    candidates = chainData.filter(c => c.hasAny);
  }

  if (candidates.length === 0) {
    // Sin balance en ninguna chain, usar popularidad
    const popularity: Record<ChainKey, number> = {
      solana: 100,
      base: 90,
      ethereum: 80,
      polygon: 70,
    };
    return availableChains.sort((a, b) => (popularity[b] || 0) - (popularity[a] || 0))[0];
  }

  // Calcular score para cada candidato
  for (const c of candidates) {
    let score = 0;

    // +1000: Tiene balance suficiente (máxima prioridad - evitar pain del usuario)
    if (c.hasEnough) score += 1000;

    // +500: Chain favorita del usuario
    if (userFavoriteChain && c.chain === userFavoriteChain) score += 500;

    // +300: Mayor balance (más liquidez disponible)
    score += Math.min(300, c.balance * 10); // Cap a 300 para balances muy altos

    // +200: Chain del destinatario (solo si tiene balance suficiente)
    if (recipientChain && c.chain === recipientChain && c.hasEnough) {
      score += 200;
    } else if (recipientChain && c.chain === recipientChain && !c.hasEnough) {
      // Penalizar si es la chain del destinatario pero no tiene balance suficiente
      score -= 100;
    }

    // +100: Chain preferida en UI
    if (preferredChain && c.chain === preferredChain) score += 100;

    // Popularidad base
    const popularity: Record<ChainKey, number> = {
      solana: 70,
      base: 60,
      ethereum: 50,
      polygon: 40,
    };
    score += popularity[c.chain] || 0;

    c.score = score;
  }

  // Ordenar por score descendente
  candidates.sort((a, b) => b.score - a.score);

  return candidates[0]?.chain;
}

/**
 * Determina si el usuario puede enviar desde una chain específica
 * Retorna: { canSend: boolean; reason?: string; suggestedChain?: ChainKey }
 */
export function canSendFromChain(
  tokenSymbol: string,
  chain: ChainKey,
  amount: number,
  userBalances?: Record<string, Record<ChainKey, number>>
): { canSend: boolean; reason?: string; suggestedChain?: ChainKey } {
  if (!amount || amount <= 0) {
    return { canSend: false, reason: "Amount must be greater than 0" };
  }

  const tokenKey = tokenSymbol.toLowerCase();
  const balance = userBalances?.[tokenKey]?.[chain] ?? 0;
  const required = estimateRequiredBalance(amount, chain);
  const hasEnough = balance >= required;

  if (hasEnough) {
    return { canSend: true };
  }

  // Buscar alternativa con balance suficiente
  if (userBalances) {
    const balancesByChain = userBalances[tokenKey];
    if (balancesByChain) {
      const alternative = Object.entries(balancesByChain)
        .filter(([, bal]) => (bal ?? 0) >= required)
        .sort(([, a], [, b]) => (b ?? 0) - (a ?? 0))[0];

      if (alternative) {
        return {
          canSend: false,
          reason: `Insufficient balance. You have ${balance.toFixed(2)} ${tokenSymbol.toUpperCase()} on ${chain}. Use ${alternative[0]} instead?`,
          suggestedChain: alternative[0] as ChainKey,
        };
      }
    }
  }

  return {
    canSend: false,
    reason: `Insufficient balance. You need at least ${required.toFixed(2)} ${tokenSymbol.toUpperCase()} on ${chain}`,
  };
}



