// src/services/api/accounts.service.ts
// Accounts & Rotation API service
import { apiClient } from '@/lib/apiClient';
import type {
  Account,
  AccountsResponse,
  CreateAccountRequest,
  RotationActiveResponse,
  RotationRotateResponse,
  RotationRegisterBatchRequest,
  RotationRegisterBatchResponse,
} from '@/types/api';

/**
 * List user accounts
 */
export async function listAccounts(): Promise<Account[]> {
  const response = await apiClient.get<AccountsResponse>('/accounts');
  return response.accounts;
}

/**
 * Create new account
 */
export async function createAccount(params: CreateAccountRequest): Promise<Account> {
  return apiClient.post<Account>('/accounts', params);
}

/**
 * Get active rotation address for account
 */
export async function getActiveRotation(accountId: string): Promise<RotationActiveResponse> {
  return apiClient.get<RotationActiveResponse>(`/accounts/${accountId}/rotation/active`);
}

/**
 * Rotate account address
 */
export async function rotateAccount(
  accountId: string,
  idempotencyKey?: string
): Promise<RotationRotateResponse> {
  return apiClient.post<RotationRotateResponse>(
    `/accounts/${accountId}/rotation/rotate`,
    {},
    {
      idempotencyKey: idempotencyKey || true,
    }
  );
}

/**
 * Register batch of addresses for rotation
 */
export async function registerBatchAddresses(
  accountId: string,
  params: RotationRegisterBatchRequest
): Promise<RotationRegisterBatchResponse> {
  return apiClient.post<RotationRegisterBatchResponse>(
    `/accounts/${accountId}/rotation/register-batch`,
    params
  );
}




