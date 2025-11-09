// src/send/api/sendPayment.ts
// Updated to use new API client
import { sendPayment as sendPaymentService } from '@/services/api/payments.service';
import type { ChainKey } from "@/config/sendMatrix";
import { API_URL } from "@/config/runtime";

export type SendParams = {
  to: string;
  tokenId: string;
  chain: ChainKey;
  amount: string; // como string para no perder precisión
  account: "daily" | "savings" | "social";
  autoBridge?: {
    plan: Array<{ chain: ChainKey; amount: number }>;
    sourceChains: ChainKey[];
  };
};

export type SendResult = {
  txId: string;
  status: "pending" | "confirmed" | "failed";
  ts: number;
  fee?: number;
};

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Send payment using backend API
 * Falls back to mock if API_URL is not configured
 */
export async function sendPayment(p: SendParams, idempotencyKey?: string): Promise<SendResult> {
  // Mock automático si no hay API_URL todavía
  if (!API_URL) {
    await sleep(600);
    return {
      txId: "mock_" + Date.now(),
      status: "confirmed",
      ts: Date.now(),
      fee: 0,
    };
  }

  try {
    // Use new API service
    const response = await sendPaymentService(
      {
        to: p.to,
        tokenId: p.tokenId,
        chain: p.chain,
        amount: p.amount,
        account: p.account,
        autoBridge: p.autoBridge,
      },
      idempotencyKey
    );

    // Convert fee from string to number if present
    return {
      txId: response.txId,
      status: response.status,
      ts: response.ts,
      fee: response.fee ? parseFloat(response.fee) : undefined,
    };
  } catch (error) {
    // Re-throw with better error message
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(`Send payment failed: ${String(error)}`);
  }
}