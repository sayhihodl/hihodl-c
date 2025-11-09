// src/services/api/auth.service.ts
// Auth & Users API service
import { apiClient } from '@/lib/apiClient';
import type {
  AuthTokenResponse,
  RefreshTokenRequest,
  RefreshTokenResponse,
  User,
  UserProfile,
} from '@/types/api';

/**
 * Verify Supabase token and get user information
 */
export async function verifySupabaseToken(): Promise<AuthTokenResponse> {
  return apiClient.post<AuthTokenResponse>('/auth/supabase', undefined, {
    skipAuth: false, // Uses auth header automatically
  });
}

/**
 * Refresh access token using refresh token
 */
export async function refreshToken(params: RefreshTokenRequest): Promise<RefreshTokenResponse> {
  return apiClient.post<RefreshTokenResponse>('/auth/refresh', params, {
    skipAuth: true, // No auth needed for refresh
  });
}

/**
 * Get current user profile
 */
export async function getMe(): Promise<User> {
  return apiClient.get<User>('/me');
}

/**
 * Update user profile
 */
export async function updateProfile(profile: Partial<UserProfile>): Promise<User> {
  return apiClient.patch<User>('/me', profile);
}

