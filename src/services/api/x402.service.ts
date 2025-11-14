// src/services/api/x402.service.ts
// x402 Payment Protocol Service for AI Agents

import { apiClient } from '@/lib/apiClient';

export interface X402PaymentRequest {
  amount: string;
  currency: string;
  chain: string;
  address: string;
  expiresAt: string;
  service: {
    id: string;
    name: string;
    description: string;
  };
}

export interface X402PaymentProof {
  txHash: string;
  chain: string;
  token: string;
  amount: string;
  timestamp: number;
}

export interface X402VerifyRequest {
  paymentProof: X402PaymentProof;
  serviceId: string;
  requestId: string;
}

export interface X402VerifyResponse {
  success: boolean;
  data: {
    verified: boolean;
    accessToken?: string;
    expiresAt?: number;
    service: {
      id: string;
      name: string;
      description: string;
    };
  };
}

/**
 * Verifica un pago x402 realizado por un agente de IA
 */
export async function verifyX402Payment(
  params: X402VerifyRequest
): Promise<X402VerifyResponse> {
  return apiClient.post<X402VerifyResponse>('/payments/x402/verify', params);
}

/**
 * Obtiene información de pago requerido (cuando se recibe 402)
 */
export function parseX402Response(response: any): X402PaymentRequest | null {
  if (response.status === 402 && response.data?.payment) {
    return response.data;
  }
  return null;
}

/**
 * Helper para manejar respuestas 402 en llamadas API
 */
export function isX402Response(response: any): boolean {
  return response?.status === 402 || response?.data?.payment !== undefined;
}



