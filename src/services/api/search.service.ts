// src/services/api/search.service.ts
// Search & Discovery API service
import { apiClient } from '@/lib/apiClient';
import type {
  SearchUsersResponse,
  SearchTokensResponse,
} from '@/types/api';

/**
 * Search users by alias or email
 */
export async function searchUsers(query: string): Promise<SearchUsersResponse> {
  const params = new URLSearchParams({ q: query });
  return apiClient.get<SearchUsersResponse>(`/search/users?${params.toString()}`);
}

/**
 * Search tokens by symbol or name
 */
export async function searchTokens(query: string): Promise<SearchTokensResponse> {
  const params = new URLSearchParams({ q: query });
  return apiClient.get<SearchTokensResponse>(`/search/tokens?${params.toString()}`, {
    skipAuth: true, // Tokens search can be public
  });
}

