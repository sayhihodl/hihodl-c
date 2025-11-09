// src/services/api/wallets.service.ts
// Wallets & Addresses API service
import { apiClient } from '@/lib/apiClient';
import type {
  Wallet,
  LinkWalletRequest,
  WalletsListResponse,
  ReceiveAddressRequest,
  ReceiveAddressResponse,
  BatchAddressesRequest,
  BatchAddressesResponse,
  ChainKey,
} from '@/types/api';

/**
 * Link external wallet to user
 */
export async function linkWallet(params: LinkWalletRequest): Promise<Wallet> {
  return apiClient.post<Wallet>('/wallets/link', params);
}

/**
 * List user wallets
 * @param chains - Optional comma-separated chain filter (e.g., "eth,base,sol")
 */
export async function listWallets(chains?: string): Promise<Wallet[]> {
  const query = chains ? `?chains=${chains}` : '';
  const response = await apiClient.get<WalletsListResponse>(`/wallets${query}`);
  return response.wallets;
}

/**
 * Get receive address for a wallet
 */
export async function getReceiveAddress(
  walletId: string,
  params: ReceiveAddressRequest
): Promise<ReceiveAddressResponse> {
  const queryParams = new URLSearchParams({
    chain: params.chain,
  });
  
  if (params.token) queryParams.append('token', params.token);
  if (params.reuse_policy) queryParams.append('reuse_policy', params.reuse_policy);
  if (params.account) queryParams.append('account', params.account);

  return apiClient.get<ReceiveAddressResponse>(
    `/wallets/${walletId}/receive-address?${queryParams.toString()}`
  );
}

/**
 * Provision batch of addresses (mainly for Solana)
 */
export async function batchProvisionAddresses(
  walletId: string,
  addresses: string[]
): Promise<BatchAddressesResponse> {
  return apiClient.post<BatchAddressesResponse>(
    `/wallets/${walletId}/addresses/batch`,
    { addresses } as BatchAddressesRequest
  );
}

