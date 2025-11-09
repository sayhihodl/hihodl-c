// src/services/api/passkeys.service.ts
// Passkeys (WebAuthn) API service
import { apiClient } from '@/lib/apiClient';
import type {
  PasskeyRegisterBeginRequest,
  PasskeyRegisterBeginResponse,
  PasskeyRegisterCompleteRequest,
  PasskeyRegisterCompleteResponse,
  PasskeyLoginBeginRequest,
  PasskeyLoginBeginResponse,
  PasskeyLoginCompleteRequest,
  PasskeyLoginCompleteResponse,
  PasskeyListResponse,
} from '@/types/api';

/**
 * Begin passkey registration
 */
export async function beginPasskeyRegistration(
  params: PasskeyRegisterBeginRequest
): Promise<PasskeyRegisterBeginResponse> {
  return apiClient.post<PasskeyRegisterBeginResponse>(
    '/passkeys/register/begin',
    params,
    { skipAuth: true } // Can be used before authentication
  );
}

/**
 * Complete passkey registration
 */
export async function completePasskeyRegistration(
  params: PasskeyRegisterCompleteRequest
): Promise<PasskeyRegisterCompleteResponse> {
  return apiClient.post<PasskeyRegisterCompleteResponse>(
    '/passkeys/register/complete',
    params,
    { skipAuth: true } // Can be used before authentication
  );
}

/**
 * Begin passkey authentication
 */
export async function beginPasskeyLogin(
  params: PasskeyLoginBeginRequest
): Promise<PasskeyLoginBeginResponse> {
  return apiClient.post<PasskeyLoginBeginResponse>(
    '/passkeys/login/begin',
    params,
    { skipAuth: true } // Used for login
  );
}

/**
 * Complete passkey authentication
 */
export async function completePasskeyLogin(
  params: PasskeyLoginCompleteRequest
): Promise<PasskeyLoginCompleteResponse> {
  return apiClient.post<PasskeyLoginCompleteResponse>(
    '/passkeys/login/complete',
    params,
    { skipAuth: true } // Used for login
  );
}

/**
 * List user passkeys
 */
export async function listPasskeys(): Promise<PasskeyListResponse> {
  return apiClient.get<PasskeyListResponse>('/passkeys/list');
}

/**
 * Delete a passkey
 */
export async function deletePasskey(passkeyId: string): Promise<{ deleted: boolean }> {
  return apiClient.delete<{ deleted: boolean }>(`/passkeys/${passkeyId}`);
}

