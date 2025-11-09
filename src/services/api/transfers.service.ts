// src/services/api/transfers.service.ts
// Transfers API service
import { apiClient } from '@/lib/apiClient';
import type {
  TransferQuoteRequest,
  TransferQuoteResponse,
  TransferSubmitRequest,
  TransferSubmitResponse,
  Transfer,
  TransferDetails,
  TransfersListResponse,
  TransferSummaryResponse,
  ChainKey,
  TransferStatus,
} from '@/types/api';

/**
 * Get quote for transfer (fees, estimated time)
 */
export async function getTransferQuote(
  params: TransferQuoteRequest
): Promise<TransferQuoteResponse> {
  return apiClient.post<TransferQuoteResponse>('/transfers/quote', params);
}

/**
 * Submit transfer (queues → worker processes)
 */
export async function submitTransfer(
  params: TransferSubmitRequest,
  idempotencyKey?: string
): Promise<TransferSubmitResponse> {
  return apiClient.post<TransferSubmitResponse>('/transfers/submit', params, {
    idempotencyKey: idempotencyKey || true, // Auto-generate if not provided
  });
}

/**
 * Get transfer status
 */
export async function getTransfer(transferId: string): Promise<Transfer> {
  return apiClient.get<Transfer>(`/transfers/${transferId}`);
}

/**
 * Get detailed transfer information
 */
export async function getTransferDetails(transferId: string): Promise<TransferDetails> {
  return apiClient.get<TransferDetails>(`/transfers/${transferId}/details`);
}

/**
 * List user transfers (history)
 */
export async function listTransfers(params?: {
  chain?: ChainKey;
  status?: TransferStatus;
  limit?: number;
  offset?: number;
}): Promise<{ transfers: Transfer[]; total: number; hasMore: boolean }> {
  const queryParams = new URLSearchParams();
  if (params?.chain) queryParams.append('chain', params.chain);
  if (params?.status) queryParams.append('status', params.status);
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.offset) queryParams.append('offset', params.offset.toString());

  const query = queryParams.toString();
  return apiClient.get<TransfersListResponse>(`/transfers${query ? `?${query}` : ''}`);
}

/**
 * Get transfer summary/statistics
 */
export async function getTransferSummary(
  range: '7d' | '30d' | '90d' | '1y' = '30d'
): Promise<TransferSummaryResponse> {
  return apiClient.get<TransferSummaryResponse>(`/transfers/summary?range=${range}`);
}

