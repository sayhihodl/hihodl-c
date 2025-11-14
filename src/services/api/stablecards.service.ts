// src/services/api/stablecards.service.ts
// API service for Stable Cards operations

import { apiClient } from '@/lib/apiClient';
import type {
  StableCard,
  StableCardsResponse,
  CreateStableCardRequest,
  CreateStableCardResponse,
  StableCardDetailsResponse,
  FreezeStableCardRequest,
  FreezeStableCardResponse,
  RevealStableCardSecretsResponse,
} from '@/types/api';

/**
 * List all stable cards for the authenticated user
 */
export async function listStableCards(): Promise<StableCard[]> {
  const response = await apiClient.get<StableCardsResponse>('/stable-cards');
  return response.cards;
}

/**
 * Get details of a specific stable card
 */
export async function getStableCard(cardId: string): Promise<StableCardDetailsResponse> {
  return apiClient.get<StableCardDetailsResponse>(`/stable-cards/${cardId}`);
}

/**
 * Create a new stable card
 */
export async function createStableCard(
  params: CreateStableCardRequest
): Promise<StableCard> {
  const response = await apiClient.post<CreateStableCardResponse>(
    '/stable-cards',
    params
  );
  return response.card;
}

/**
 * Freeze or unfreeze a stable card
 */
export async function freezeStableCard(
  cardId: string,
  freeze: boolean
): Promise<StableCard> {
  const response = await apiClient.patch<FreezeStableCardResponse>(
    `/stable-cards/${cardId}/freeze`,
    { freeze } as FreezeStableCardRequest
  );
  return response.card;
}

/**
 * Delete/cancel a stable card
 */
export async function deleteStableCard(cardId: string): Promise<{ deleted: boolean }> {
  return apiClient.delete<{ deleted: boolean }>(`/stable-cards/${cardId}`);
}

/**
 * Reveal card secrets (PAN, expiration, CVV)
 * Note: This should only be called when user explicitly requests to view secrets
 */
export async function revealStableCardSecrets(
  cardId: string
): Promise<RevealStableCardSecretsResponse> {
  return apiClient.post<RevealStableCardSecretsResponse>(
    `/stable-cards/${cardId}/reveal`
  );
}

/**
 * Update card label/name
 */
export async function updateStableCardLabel(
  cardId: string,
  label: string
): Promise<StableCard> {
  const response = await apiClient.patch<{ card: StableCard }>(
    `/stable-cards/${cardId}`,
    { label }
  );
  return response.card;
}





