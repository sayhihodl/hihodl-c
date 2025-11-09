// src/services/api/proofs.service.ts
// Proofs & Statements API service
import { apiClient } from '@/lib/apiClient';
import type {
  CreateProofRequest,
  Proof,
  Statement,
  StatementsResponse,
} from '@/types/api';

/**
 * Create proof for transfer (payment receipt, etc.)
 */
export async function createProof(params: CreateProofRequest): Promise<Proof> {
  return apiClient.post<Proof>('/proofs', params);
}

/**
 * Get proof by ID
 */
export async function getProof(proofId: string): Promise<Proof> {
  return apiClient.get<Proof>(`/proofs/${proofId}`);
}

/**
 * Get statements (monthly summaries)
 * @param month - Optional month in format "YYYY-MM" (default: current month)
 */
export async function getStatements(month?: string): Promise<StatementsResponse> {
  const query = month ? `?month=${month}` : '';
  return apiClient.get<StatementsResponse>(`/statements${query}`);
}




