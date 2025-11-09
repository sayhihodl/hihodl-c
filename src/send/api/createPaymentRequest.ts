// src/send/api/createPaymentRequest.ts
// Updated to use new API client
import { createPaymentRequest as createPaymentRequestService } from '@/services/api/payments.service';
import { API_URL } from "@/config/runtime";
import type { ChainKey } from "@/config/sendMatrix";

export type CreatePaymentRequestArgs = {
  from: string;  // handle sin @
  tokenId: string;
  chain: ChainKey;
  amount: string;
  account: "daily" | "savings" | "social";
};

export type CreatePaymentRequestRes = {
  requestId: string;
  status: "requested";
  ts: number;
};

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Create payment request using backend API
 * Falls back to mock if API_URL is not configured
 */
export async function createPaymentRequest(
  args: CreatePaymentRequestArgs
): Promise<CreatePaymentRequestRes> {
  // Mock automático si no hay API_URL todavía
  if (!API_URL) {
    await sleep(350);
    return { 
      requestId: `req_${Date.now()}`, 
      status: "requested" as const, 
      ts: Date.now() 
    };
  }

  try {
    // Use new API service
    return await createPaymentRequestService({
      from: args.from.startsWith('@') ? args.from : `@${args.from}`,
      tokenId: args.tokenId,
      chain: args.chain,
      amount: args.amount,
      account: args.account,
    });
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(`Create payment request failed: ${String(error)}`);
  }
}