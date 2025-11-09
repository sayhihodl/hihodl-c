// src/services/paymentEnhancements.ts
// Mejoras adicionales para eliminar puntos de fricción en payments

import type { ChainKey } from "@/config/sendMatrix";

export type PaymentConfirmation = {
  recipient: string;
  amount: number;
  tokenId: string;
  chain: ChainKey;
  fees: {
    bridgeFee?: number;
    networkFee: number;
    total: number;
  };
  autoBridge?: {
    fromChains: ChainKey[];
    bridgeAmount: number;
  };
  estimatedTime: string; // "~30 seconds" | "~2 minutes"
  warnings?: Array<{
    type: "high_amount" | "first_time_recipient" | "different_chain" | "large_bridge";
    message: string;
  }>;
};

/**
 * Calcula fees estimadas para un pago
 */
export function calculatePaymentFees(
  amount: number,
  chain: ChainKey,
  autoBridge?: { fromChains: ChainKey[]; bridgeAmount: number }
): PaymentConfirmation["fees"] {
  const feePct = chain === "solana" ? 0.001 : chain === "base" ? 0.002 : 0.003;
  const networkFee = amount * feePct;
  
  let bridgeFee = 0;
  if (autoBridge && autoBridge.bridgeAmount > 0) {
    // Bridge fee adicional: 0.5% del amount bridgeado
    bridgeFee = autoBridge.bridgeAmount * 0.005;
  }
  
  return {
    bridgeFee: bridgeFee > 0 ? bridgeFee : undefined,
    networkFee,
    total: networkFee + bridgeFee,
  };
}

/**
 * Genera confirmación con toda la info antes de enviar
 */
export function buildPaymentConfirmation(params: {
  recipient: string;
  amount: number;
  tokenId: string;
  chain: ChainKey;
  autoBridge?: { fromChains: ChainKey[]; bridgeAmount: number };
  recipientChain?: ChainKey;
  isFirstTimeRecipient?: boolean;
}): PaymentConfirmation {
  const { amount, chain, autoBridge, recipientChain, isFirstTimeRecipient } = params;
  
  const fees = calculatePaymentFees(amount, chain, autoBridge);
  
  // Estimar tiempo
  let estimatedTime = "~30 seconds";
  if (autoBridge) {
    estimatedTime = "~2 minutes"; // Bridge toma más tiempo
  } else if (chain === "ethereum" || chain === "polygon") {
    estimatedTime = "~1 minute";
  }
  
  // Warnings
  const warnings: PaymentConfirmation["warnings"] = [];
  
  // High amount warning
  if (amount > 10000) {
    warnings.push({
      type: "high_amount",
      message: `You're sending ${amount.toLocaleString()} ${params.tokenId.toUpperCase()}. This is a large amount.`,
    });
  }
  
  // First time recipient
  if (isFirstTimeRecipient) {
    warnings.push({
      type: "first_time_recipient",
      message: "This is the first time you're sending to this recipient. Double-check the address.",
    });
  }
  
  // Different chain warning
  if (recipientChain && recipientChain !== chain) {
    warnings.push({
      type: "different_chain",
      message: `Recipient's preferred chain is ${recipientChain.toUpperCase()}, but you're sending on ${chain.toUpperCase()}.`,
    });
  }
  
  // Large bridge warning
  if (autoBridge && autoBridge.bridgeAmount > amount * 0.5) {
    warnings.push({
      type: "large_bridge",
      message: `Most of this payment will be bridged from ${autoBridge.fromChains.join(", ")}. This may take a few minutes.`,
    });
  }
  
  return {
    recipient: params.recipient,
    amount,
    tokenId: params.tokenId,
    chain,
    fees,
    autoBridge,
    estimatedTime,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}

/**
 * Valida si un amount es sospechoso (posible error tipográfico)
 */
export function detectAmountAnomaly(
  amount: number,
  historicalAmounts: number[],
  currentBalance: number
): { isAnomalous: boolean; reason?: string; suggested?: number } {
  // Si es mucho más grande que los montos históricos
  if (historicalAmounts.length > 0) {
    const avgHistorical = historicalAmounts.reduce((s, a) => s + a, 0) / historicalAmounts.length;
    const maxHistorical = Math.max(...historicalAmounts);
    
    if (amount > maxHistorical * 10) {
      return {
        isAnomalous: true,
        reason: `This amount is ${Math.round(amount / avgHistorical)}x larger than your average.`,
        suggested: maxHistorical,
      };
    }
  }
  
  // Si es casi todo el balance (posible error)
  if (amount > currentBalance * 0.95) {
    return {
      isAnomalous: true,
      reason: "This would use almost all your balance. Did you mean to send everything?",
    };
  }
  
  // Si es un número redondo muy grande (ej: 1000, 10000) sin decimales
  const isRound = amount === Math.floor(amount) && amount % 1000 === 0 && amount >= 1000;
  if (isRound && historicalAmounts.length > 0) {
    const avgHistorical = historicalAmounts.reduce((s, a) => s + a, 0) / historicalAmounts.length;
    if (amount > avgHistorical * 5) {
      return {
        isAnomalous: true,
        reason: "Large round number detected. Please verify this is correct.",
      };
    }
  }
  
  return { isAnomalous: false };
}

/**
 * Valida destinatario antes de enviar
 */
export type RecipientValidation = {
  isValid: boolean;
  exists: boolean;
  acceptsToken?: boolean;
  acceptsChain?: boolean;
  warnings?: string[];
  suggestions?: string[];
};

export async function validateRecipient(
  recipient: string,
  tokenId: string,
  chain: ChainKey
): Promise<RecipientValidation> {
  // TODO: Integrar con backend para validar
  // Por ahora, validaciones básicas
  
  const warnings: string[] = [];
  const suggestions: string[] = [];
  
  // Validar formato básico
  if (!recipient || recipient.trim().length === 0) {
    return { isValid: false, exists: false };
  }
  
  // Si parece una dirección de wallet (muy larga)
  if (recipient.length > 40 && !recipient.includes("@")) {
    warnings.push("This looks like a wallet address. Make sure it's correct.");
  }
  
  // Si es un handle/alias
  if (recipient.startsWith("@") || recipient.includes("@")) {
    // TODO: Verificar si existe en el sistema
    // Por ahora asumimos que existe
    return {
      isValid: true,
      exists: true,
      acceptsToken: true, // TODO: Verificar
      acceptsChain: true, // TODO: Verificar
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  }
  
  return {
    isValid: true,
    exists: true,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}

/**
 * Genera un receipt/comprobante para compartir
 */
export type PaymentReceipt = {
  id: string;
  date: string;
  recipient: string;
  amount: number;
  tokenId: string;
  chain: ChainKey;
  txHash?: string;
  status: "pending" | "confirmed" | "failed";
  fees: number;
  explorerUrl?: string;
};

export function generateReceipt(params: {
  id: string;
  recipient: string;
  amount: number;
  tokenId: string;
  chain: ChainKey;
  txHash?: string;
  status: "pending" | "confirmed" | "failed";
  fees: number;
}): PaymentReceipt {
  return {
    id: params.id,
    date: new Date().toISOString(),
    recipient: params.recipient,
    amount: params.amount,
    tokenId: params.tokenId,
    chain: params.chain,
    txHash: params.txHash,
    status: params.status,
    fees: params.fees,
    explorerUrl: params.txHash
      ? `https://explorer.solana.com/tx/${params.txHash}` // TODO: Multi-chain explorer
      : undefined,
  };
}

/**
 * Determina si un error es recuperable (puede reintentar)
 */
export function isRecoverableError(error: Error | string): {
  recoverable: boolean;
  autoRetry: boolean;
  retryDelay?: number;
} {
  const errorMsg = typeof error === "string" ? error : error.message?.toLowerCase() || "";
  
  // Errores de red - auto-retry
  if (
    errorMsg.includes("network") ||
    errorMsg.includes("timeout") ||
    errorMsg.includes("connection") ||
    errorMsg.includes("fetch failed")
  ) {
    return {
      recoverable: true,
      autoRetry: true,
      retryDelay: 2000, // 2 segundos
    };
  }
  
  // Errores de rate limit - retry después
  if (errorMsg.includes("rate limit") || errorMsg.includes("too many requests")) {
    return {
      recoverable: true,
      autoRetry: true,
      retryDelay: 5000, // 5 segundos
    };
  }
  
  // Errores de validación - no recuperable
  if (
    errorMsg.includes("invalid") ||
    errorMsg.includes("insufficient") ||
    errorMsg.includes("balance")
  ) {
    return {
      recoverable: false,
      autoRetry: false,
    };
  }
  
  // Otros errores - intentar una vez más
  return {
    recoverable: true,
    autoRetry: false,
  };
}

