// src/services/api/alias.service.ts
// Alias API service
import { apiClient } from '@/lib/apiClient';
import type {
  CreateAliasRequest,
  Alias,
  ResolveAliasResponse,
} from '@/types/api';

/**
 * Create or update user alias
 */
export async function createAlias(params: CreateAliasRequest): Promise<Alias> {
  return apiClient.post<Alias>('/alias', params);
}

/**
 * Resolve alias to address/chain
 */
export async function resolveAlias(alias: string): Promise<ResolveAliasResponse> {
  // Remove @ prefix if present
  const cleanAlias = alias.startsWith('@') ? alias.substring(1) : alias;
  return apiClient.get<ResolveAliasResponse>(`/alias/resolve/${cleanAlias}`, {
    skipAuth: true, // Aliases can be public
  });
}

