// src/services/paymentDiagnostics.ts
// Sistema completo de diagnóstico y soluciones para problemas de envío de pagos
import type { ChainKey } from "@/config/sendMatrix";

export type DiagnosticProblem = 
  | "no_balance_any_token"
  | "insufficient_balance"
  | "token_not_available_chain"
  | "token_not_selected"
  | "no_recipient"
  | "invalid_amount"
  | "network_issue"
  | "rate_limit"
  | "pending_transaction"
  | null;

export type SolutionAction = 
  | "request_payment"
  | "buy_crypto"
  | "swap_tokens"
  | "change_chain"
  | "receive_funds"
  | "wait"
  | "retry"
  | "auto_bridge"; // Nuevo: bridge automático de balances de múltiples chains

export type DiagnosticResult = {
  problem: DiagnosticProblem;
  severity: "critical" | "warning" | "info";
  message: string;
  solutions: Array<{
    action: SolutionAction;
    label: string;
    description: string;
    icon?: string;
    priority: number; // Menor = más prioritario
  }>;
  metadata?: Record<string, any>;
  // NUEVO: Información sobre balances en otras cuentas (informativa, no automática)
  otherAccountsBalance?: {
    accountType: "savings" | "social";
    tokenId: string;
    chain: ChainKey;
    balance: number;
  }[];
};

type DiagnosticContext = {
  tokenId?: string;
  chain?: ChainKey;
  amount?: number;
  userBalances?: Record<string, Partial<Record<ChainKey, number>>>; // tokenId -> { chain -> balance }
  // NUEVO: Balances de otras cuentas (informativos, NO se usarán automáticamente)
  otherAccountsBalances?: Record<string, Partial<Record<ChainKey, number>>>; // accountId -> tokenId -> { chain -> balance }
  recipient?: string;
  hasNetworkConnection?: boolean;
  pendingTxCount?: number;
};

/**
 * Diagnóstico completo de problemas antes de enviar un pago.
 * Retorna el problema más crítico y sus soluciones.
 * 
 * NOTA IMPORTANTE SOBRE OTRAS CUENTAS (Savings/Social):
 * - NO usamos automáticamente balances de otras cuentas para auto-bridge
 * - Solo mostramos información informativa si el usuario tiene fondos en otras cuentas
 * - El usuario debe decidir explícitamente si quiere transferir desde otra cuenta
 * - Esto evita confusión y respeta la separación de propósitos de cada cuenta
 */
export function diagnosePaymentIssues(context: DiagnosticContext): DiagnosticResult {
  const {
    tokenId,
    chain,
    amount,
    userBalances = {},
    otherAccountsBalances = {}, // NUEVO: balances de otras cuentas (informativos)
    recipient,
    hasNetworkConnection = true,
    pendingTxCount = 0,
  } = context;

  // ========== 1) CRÍTICO: Sin balance en ningún token ==========
  const totalBalance = Object.values(userBalances).reduce((sum, byChain) => {
    return sum + Object.values(byChain).reduce((s, v) => s + (v ?? 0), 0);
  }, 0);

  if (totalBalance === 0) {
    // Verificar si hay balances en otras cuentas (informativo)
    const otherAccountsInfo: DiagnosticResult["otherAccountsBalance"] = [];
    for (const [accountId, accountBalances] of Object.entries(otherAccountsBalances)) {
      for (const [tokenKey, byChain] of Object.entries(accountBalances)) {
        const total = Object.values(byChain || {}).reduce((s, v) => s + (v ?? 0), 0);
        if (total > 0) {
          // Encontrar la chain con más balance
          const bestChain = Object.entries(byChain || {})
            .sort(([, a], [, b]) => (b ?? 0) - (a ?? 0))[0]?.[0] as ChainKey | undefined;
          if (bestChain) {
            otherAccountsInfo.push({
              accountType: accountId === "savings" ? "savings" : "social",
              tokenId: tokenKey,
              chain: bestChain,
              balance: total,
            });
          }
        }
      }
    }

    return {
      problem: "no_balance_any_token",
      severity: "critical",
      message: "You don't have any funds to send. Let's get you started!",
      solutions: [
        {
          action: "request_payment",
          label: "Request payment",
          description: "Ask someone to send you crypto",
          icon: "chatbubble-outline",
          priority: 1,
        },
        {
          action: "buy_crypto",
          label: "Buy crypto",
          description: "Purchase USDC with your card or bank",
          icon: "card-outline",
          priority: 2,
        },
        {
          action: "receive_funds",
          label: "Receive",
          description: "Share your address to receive funds",
          icon: "download-outline",
          priority: 3,
        },
      ],
      metadata: { totalBalance: 0 },
      otherAccountsBalance: otherAccountsInfo.length > 0 ? otherAccountsInfo : undefined,
    };
  }

  // ========== 2) CRÍTICO: Amount inválido ==========
  if (!amount || amount <= 0) {
    return {
      problem: "invalid_amount",
      severity: "critical",
      message: "Please enter an amount to send",
      solutions: [],
    };
  }

  // ========== 3) CRÍTICO: Sin destinatario ==========
  if (!recipient || recipient.trim().length === 0) {
    return {
      problem: "no_recipient",
      severity: "critical",
      message: "Please select a recipient",
      solutions: [],
    };
  }

  // ========== 4) CRÍTICO: Sin conexión de red ==========
  if (!hasNetworkConnection) {
    return {
      problem: "network_issue",
      severity: "critical",
      message: "No internet connection. Please check your network settings.",
      solutions: [
        {
          action: "wait",
          label: "Wait",
          description: "Wait for connection to be restored",
          icon: "time-outline",
          priority: 1,
        },
        {
          action: "retry",
          label: "Retry",
          description: "Try again once connected",
          icon: "refresh-outline",
          priority: 2,
        },
      ],
    };
  }

  // ========== 5) WARNING: Transacciones pendientes ==========
  if (pendingTxCount > 0) {
    return {
      problem: "pending_transaction",
      severity: "warning",
      message: `You have ${pendingTxCount} pending transaction(s). Please wait for them to complete.`,
      solutions: [
        {
          action: "wait",
          label: "Wait",
          description: "Wait for pending transactions to complete",
          icon: "time-outline",
          priority: 1,
        },
      ],
    };
  }

  // ========== 6) CRÍTICO: Token no seleccionado ==========
  if (!tokenId || !chain) {
    return {
      problem: "token_not_selected",
      severity: "warning",
      message: "Please select a token to send",
      solutions: [],
    };
  }

  const tokenKey = tokenId.toLowerCase();
  const balancesByChain = userBalances[tokenKey] || {};
  const balanceOnChain = balancesByChain[chain] ?? 0;

  // ========== 7) CRÍTICO: Token no disponible en esta chain ==========
  if (!balancesByChain || Object.keys(balancesByChain).length === 0) {
    return {
      problem: "token_not_available_chain",
      severity: "critical",
      message: `${tokenId.toUpperCase()} is not available on ${chain.toUpperCase()}`,
      solutions: [
        {
          action: "change_chain",
          label: "Change chain",
          description: `Switch to a chain where ${tokenId.toUpperCase()} is available`,
          icon: "swap-horizontal-outline",
          priority: 1,
        },
      ],
    };
  }

  // ========== 8) CRÍTICO: Balance insuficiente ==========
  // Calcular fees (gasless model: HiHODL paga gas, usuario paga fees en token enviado)
  const feePct = chain === "solana" ? 0.001 : chain === "base" ? 0.002 : 0.003;
  const required = amount * (1 + feePct);
  
  if (balanceOnChain < required) {
    const balancesByChain = userBalances[tokenKey] || {};
    
    // Calcular balance TOTAL agregado de todas las chains (SOLO de la cuenta actual - Daily)
    const totalBalanceAcrossChains = Object.values(balancesByChain).reduce(
      (sum, bal) => sum + (bal ?? 0),
      0
    );

    // Buscar alternativas con balance suficiente en una sola chain (SOLO Daily)
    const alternatives: Array<{ chain: ChainKey; balance: number }> = [];
    for (const [c, bal] of Object.entries(balancesByChain)) {
      if ((bal ?? 0) >= required) {
        alternatives.push({ chain: c as ChainKey, balance: bal ?? 0 });
      }
    }

    // Calcular si podemos hacer auto-bridge (suma de múltiples chains es suficiente - SOLO Daily)
    const canAutoBridge = totalBalanceAcrossChains >= required && alternatives.length === 0;
    
    // Si podemos hacer auto-bridge, calcular la mejor combinación (SOLO desde Daily)
    let autoBridgePlan: Array<{ chain: ChainKey; amount: number }> | null = null;
    if (canAutoBridge) {
      // Estrategia: usar la chain del destinatario como destino final
      // Si no hay chain del destinatario, usar la chain con más balance como destino
      const destinationChain = chain; // Chain seleccionada es la de destino
      const chainsWithBalance = Object.entries(balancesByChain)
        .filter(([, bal]) => (bal ?? 0) > 0)
        .map(([c, bal]) => ({ chain: c as ChainKey, balance: bal ?? 0 }))
        .sort((a, b) => {
          // Priorizar: chain de destino primero, luego por balance
          if (a.chain === destinationChain) return -1;
          if (b.chain === destinationChain) return 1;
          return b.balance - a.balance;
        });

      let remaining = required;
      autoBridgePlan = [];

      for (const { chain: c, balance: bal } of chainsWithBalance) {
        if (remaining <= 0) break;
        
        if (c === destinationChain) {
          // Usar todo el balance de la chain de destino
          const use = Math.min(bal, remaining);
          if (use > 0) {
            autoBridgePlan.push({ chain: c, amount: use });
            remaining -= use;
          }
        } else {
          // Bridge desde esta chain a la de destino
          const use = Math.min(bal, remaining);
          if (use > 0) {
            autoBridgePlan.push({ chain: c, amount: use });
            remaining -= use;
          }
        }
      }

      // Verificar que el plan cubra el requerimiento
      const totalInPlan = autoBridgePlan.reduce((sum, p) => sum + p.amount, 0);
      if (totalInPlan < required) {
        autoBridgePlan = null; // Plan no es suficiente
      }
    }

    // Buscar otros tokens con balance suficiente (SOLO Daily)
    const otherTokens: Array<{ tokenId: string; chain: ChainKey; balance: number }> = [];
    for (const [t, byChain] of Object.entries(userBalances)) {
      if (t.toLowerCase() === tokenKey) continue;
      for (const [c, bal] of Object.entries(byChain)) {
        if ((bal ?? 0) >= required) {
          otherTokens.push({
            tokenId: t,
            chain: c as ChainKey,
            balance: bal ?? 0,
          });
        }
      }
    }

    // NUEVO: Revisar balances en otras cuentas (informativo, NO automático)
    const otherAccountsInfo: DiagnosticResult["otherAccountsBalance"] = [];
    for (const [accountId, accountBalances] of Object.entries(otherAccountsBalances)) {
      const accountBalancesTyped = accountBalances as Record<string, Partial<Record<ChainKey, number>>>;
      const accountTokenBalance = accountBalancesTyped[tokenKey] as Partial<Record<ChainKey, number>> | undefined;
      if (accountTokenBalance) {
        const accountTotal = Object.values(accountTokenBalance).reduce((s: number, v) => {
          const val = v ?? 0;
          return s + (typeof val === "number" ? val : 0);
        }, 0);
        if (accountTotal > 0) {
          // Encontrar la chain con más balance en esta cuenta
          const bestChain = Object.entries(accountTokenBalance)
            .sort(([, a], [, b]) => {
              const aVal = (a ?? 0) as number;
              const bVal = (b ?? 0) as number;
              return bVal - aVal;
            })[0]?.[0] as ChainKey | undefined;
          if (bestChain) {
            otherAccountsInfo.push({
              accountType: accountId === "savings" ? "savings" : "social",
              tokenId: tokenKey,
              chain: bestChain,
              balance: accountTotal,
            });
          }
        }
      }
    }

    const solutions: DiagnosticResult["solutions"] = [];

    // Solución 1 (ALTA PRIORIDAD): Auto-bridge desde múltiples chains (SOLO Daily)
    if (autoBridgePlan && autoBridgePlan.length > 1) {
      const bridges = autoBridgePlan.filter(p => p.chain !== chain);
      const totalBridged = bridges.reduce((sum, p) => sum + p.amount, 0);
      const sourceChains = bridges.map(p => p.chain.toUpperCase()).join(" + ");
      
      solutions.push({
        action: "auto_bridge",
        label: `Auto-bridge from ${sourceChains}`,
        description: `Send ${amount.toFixed(2)} ${tokenId.toUpperCase()} by bridging ${totalBridged.toFixed(2)} from ${sourceChains} to ${chain.toUpperCase()} automatically. HiHODL handles everything!`,
        icon: "git-branch-outline",
        priority: 1, // Máxima prioridad - más conveniente
      });
    }

    // Solución 2: Cambiar a otra chain donde sí hay balance suficiente
    if (alternatives.length > 0) {
      const bestAlt = alternatives[0];
      solutions.push({
        action: "change_chain",
        label: `Switch to ${bestAlt.chain.toUpperCase()}`,
        description: `You have enough ${tokenId.toUpperCase()} on ${bestAlt.chain.toUpperCase()} (${bestAlt.balance.toFixed(2)} available)`,
        icon: "swap-horizontal-outline",
        priority: 2,
      });
    }

    // Solución 3: Usar otro token con balance suficiente
    if (otherTokens.length > 0) {
      const bestToken = otherTokens[0];
      solutions.push({
        action: "swap_tokens",
        label: `Send ${bestToken.tokenId.toUpperCase()} instead`,
        description: `You have ${bestToken.balance.toFixed(2)} ${bestToken.tokenId.toUpperCase()} available on ${bestToken.chain.toUpperCase()}`,
        icon: "swap-horizontal-outline",
        priority: 3,
      });
    }

    // Solución 4: Comprar más crypto
    const missing = required - balanceOnChain;
    solutions.push({
      action: "buy_crypto",
      label: "Buy more crypto",
      description: `Purchase ${missing.toFixed(2)} ${tokenId.toUpperCase()} to complete payment`,
      icon: "card-outline",
      priority: 4,
    });

    // Solución 5: Solicitar pago
    solutions.push({
      action: "request_payment",
      label: "Request payment",
      description: "Ask someone to send you the missing amount",
      icon: "chatbubble-outline",
      priority: 5,
    });

    return {
      problem: "insufficient_balance",
      severity: "critical",
      message: `Insufficient balance. You need ${required.toFixed(2)} ${tokenId.toUpperCase()} but only have ${balanceOnChain.toFixed(2)} on ${chain.toUpperCase()}.`,
      solutions,
      metadata: {
        balanceOnChain,
        required,
        totalBalanceAcrossChains,
        canAutoBridge,
        autoBridgePlan,
      },
      // NUEVO: Información sobre balances en otras cuentas (informativa)
      otherAccountsBalance: otherAccountsInfo.length > 0 ? otherAccountsInfo : undefined,
    };
  }

  // ========== TODO OK ==========
  return {
    problem: null,
    severity: "info",
    message: "Payment ready to send",
    solutions: [],
  };
}
