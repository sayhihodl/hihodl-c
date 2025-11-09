// src/services/feeBalanceValidation.ts
// Validación de balance para fees y soluciones cuando falta balance
import type { ChainKey } from "@/config/sendMatrix";

export type BalanceCheck = {
  hasSufficientBalance: boolean;
  amountNeeded: number;
  missingAmount: number;
  canPayFeesFromOtherToken: boolean;
  alternativeTokens: Array<{
    tokenId: string;
    chain: ChainKey;
    availableBalance: number;
    canCoverFees: boolean;
  }>;
};

export type FeeBalanceValidationContext = {
  tokenId: string;
  chain: ChainKey;
  amount: number;
  feeAmount: number;
  userBalances: Record<string, Partial<Record<ChainKey, number>>>;
  account: "daily" | "savings" | "social";
};

/**
 * Valida si el usuario tiene balance suficiente para amount + fees
 * y encuentra alternativas si falta balance
 */
export function validateFeeBalance(context: FeeBalanceValidationContext): BalanceCheck {
  const { tokenId, chain, amount, feeAmount, userBalances, account } = context;
  
  const tokenKey = tokenId.toLowerCase();
  const tokenBalances = userBalances[tokenKey] || {};
  const balanceOnChain = tokenBalances[chain] ?? 0;
  
  const totalNeeded = amount + feeAmount;
  const hasSufficientBalance = balanceOnChain >= totalNeeded;
  const missingAmount = Math.max(0, totalNeeded - balanceOnChain);
  
  // Buscar tokens alternativos que puedan cubrir los fees
  const alternativeTokens: BalanceCheck["alternativeTokens"] = [];
  
  for (const [otherTokenId, byChain] of Object.entries(userBalances)) {
    if (otherTokenId === tokenKey) continue; // Ya lo verificamos
    
    for (const [otherChain, balance] of Object.entries(byChain || {})) {
      if ((balance ?? 0) > 0) {
        alternativeTokens.push({
          tokenId: otherTokenId,
          chain: otherChain as ChainKey,
          availableBalance: balance ?? 0,
          canCoverFees: (balance ?? 0) >= feeAmount,
        });
      }
    }
  }
  
  // Ordenar por: puede cubrir fees > mayor balance > mismo token diferente chain > stables
  alternativeTokens.sort((a, b) => {
    if (a.canCoverFees && !b.canCoverFees) return -1;
    if (!a.canCoverFees && b.canCoverFees) return 1;
    if (a.tokenId === tokenKey && b.tokenId !== tokenKey) return -1;
    if (a.tokenId !== tokenKey && b.tokenId === tokenKey) return 1;
    
    // Priorizar stables
    const aIsStable = a.tokenId === "usdc" || a.tokenId === "usdt";
    const bIsStable = b.tokenId === "usdc" || b.tokenId === "usdt";
    if (aIsStable && !bIsStable) return -1;
    if (!aIsStable && bIsStable) return 1;
    
    return b.availableBalance - a.availableBalance;
  });
  
  const canPayFeesFromOtherToken = alternativeTokens.some(t => t.canCoverFees);
  
  return {
    hasSufficientBalance,
    amountNeeded: totalNeeded,
    missingAmount,
    canPayFeesFromOtherToken,
    alternativeTokens: alternativeTokens.slice(0, 5), // Top 5 alternativas
  };
}

/**
 * Encuentra el mejor token para pagar fees cuando el token principal no tiene suficiente
 */
export function findBestTokenForFees(
  feeAmount: number,
  userBalances: Record<string, Partial<Record<ChainKey, number>>>,
  preferredChain?: ChainKey
): { tokenId: string; chain: ChainKey; balance: number } | null {
  const candidates: Array<{ tokenId: string; chain: ChainKey; balance: number }> = [];
  
  for (const [tokenId, byChain] of Object.entries(userBalances)) {
    for (const [chain, balance] of Object.entries(byChain || {})) {
      if ((balance ?? 0) >= feeAmount) {
        candidates.push({
          tokenId: tokenId.toLowerCase(),
          chain: chain as ChainKey,
          balance: balance ?? 0,
        });
      }
    }
  }
  
  if (candidates.length === 0) return null;
  
  // Priorizar: misma chain > stables > mayor balance
  candidates.sort((a, b) => {
    if (preferredChain) {
      if (a.chain === preferredChain && b.chain !== preferredChain) return -1;
      if (a.chain !== preferredChain && b.chain === preferredChain) return 1;
    }
    
    const aIsStable = a.tokenId === "usdc" || a.tokenId === "usdt";
    const bIsStable = b.tokenId === "usdc" || b.tokenId === "usdt";
    if (aIsStable && !bIsStable) return -1;
    if (!aIsStable && bIsStable) return 1;
    
    return b.balance - a.balance;
  });
  
  return candidates[0];
}

