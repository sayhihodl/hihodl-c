// src/services/api/relayers.service.ts
// Relayers (Gasless) API service
import { apiClient } from '@/lib/apiClient';
import type {
  RelayerSolanaQuoteRequest,
  RelayerSolanaQuoteResponse,
  RelayerSolanaSubmitRequest,
  RelayerSolanaSubmitResponse,
  RelayerSolanaTxResponse,
  RelayerEVMQuoteRequest,
  RelayerEVMQuoteResponse,
  RelayerEVMSubmitRequest,
  RelayerEVMSubmitResponse,
  RelayerEVMTxResponse,
} from '@/types/api';

/**
 * Get quote for Solana gasless transaction
 */
export async function getSolanaRelayerQuote(
  params: RelayerSolanaQuoteRequest
): Promise<RelayerSolanaQuoteResponse> {
  return apiClient.post<RelayerSolanaQuoteResponse>('/relayer/solana/quote', params);
}

/**
 * Submit Solana gasless transaction
 */
export async function submitSolanaRelayer(
  params: RelayerSolanaSubmitRequest,
  idempotencyKey?: string
): Promise<RelayerSolanaSubmitResponse> {
  return apiClient.post<RelayerSolanaSubmitResponse>('/relayer/solana/submit', params, {
    idempotencyKey: idempotencyKey || true,
  });
}

/**
 * Get Solana transaction status
 */
export async function getSolanaRelayerTx(signature: string): Promise<RelayerSolanaTxResponse> {
  return apiClient.get<RelayerSolanaTxResponse>(`/relayer/solana/tx/${signature}`);
}

/**
 * Get quote for EVM gasless transaction
 */
export async function getEVMRelayerQuote(
  params: RelayerEVMQuoteRequest
): Promise<RelayerEVMQuoteResponse> {
  return apiClient.post<RelayerEVMQuoteResponse>('/relayer/evm/quote', params);
}

/**
 * Submit EVM gasless transaction
 */
export async function submitEVMRelayer(
  params: RelayerEVMSubmitRequest,
  idempotencyKey?: string
): Promise<RelayerEVMSubmitResponse> {
  return apiClient.post<RelayerEVMSubmitResponse>('/relayer/evm/submit', params, {
    idempotencyKey: idempotencyKey || true,
  });
}

/**
 * Get EVM transaction status
 */
export async function getEVMRelayerTx(txHash: string): Promise<RelayerEVMTxResponse> {
  return apiClient.get<RelayerEVMTxResponse>(`/relayer/evm/tx/${txHash}`);
}




