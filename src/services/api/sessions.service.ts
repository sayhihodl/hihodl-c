// src/services/api/sessions.service.ts
// Security & Sessions API service
import { apiClient } from '@/lib/apiClient';
import type {
  Session,
  SessionsResponse,
  RevokeAllSessionsRequest,
  RevokeAllSessionsResponse,
  PepperResponse,
} from '@/types/api';

/**
 * Get current session information
 */
export async function getCurrentSession(): Promise<Session> {
  return apiClient.get<Session>('/sessions/current');
}

/**
 * List active sessions
 */
export async function listSessions(): Promise<{ sessions: Session[]; totalActive: number }> {
  const response = await apiClient.get<SessionsResponse>('/sessions');
  return {
    sessions: response.sessions,
    totalActive: response.totalActive,
  };
}

/**
 * Revoke specific session
 */
export async function revokeSession(sessionId: string): Promise<{ revoked: boolean; message: string }> {
  return apiClient.delete<{ revoked: boolean; message: string }>(`/sessions/${sessionId}`);
}

/**
 * Revoke all sessions except current
 */
export async function revokeAllSessions(
  params: RevokeAllSessionsRequest
): Promise<RevokeAllSessionsResponse> {
  return apiClient.post<RevokeAllSessionsResponse>('/sessions/revoke-all', params);
}

/**
 * Get server pepper for vault encryption
 */
export async function getPepper(): Promise<PepperResponse> {
  return apiClient.get<PepperResponse>('/security/pepper');
}

