// src/services/api/balances.service.ts
// Balances & Prices API service
import { apiClient } from '@/lib/apiClient';
import type {
  Balance,
  BalancesResponse,
  PricesResponse,
  PriceHistoryResponse,
  ChainKey,
  AccountType,
} from '@/types/api';

/**
 * Get user balances by chain
 * @param chains - Optional comma-separated chain filter
 * @param account - Optional account type filter
 */
export async function getBalances(
  chains?: string,
  account?: AccountType
): Promise<Balance[]> {
  const params = new URLSearchParams();
  if (chains) params.append('chains', chains);
  if (account) params.append('account', account);

  const query = params.toString();
  const response = await apiClient.get<BalancesResponse>(
    `/balances${query ? `?${query}` : ''}`
  );
  return response.balances;
}

/**
 * Get current token prices
 * @param symbols - Comma-separated symbols (e.g., "USDC,SOL,ETH")
 * @param fiat - Fiat currency (default: USD)
 */
export async function getPrices(
  symbols: string,
  fiat: string = 'USD'
): Promise<PricesResponse> {
  const params = new URLSearchParams({
    symbols,
    fiat,
  });
  return apiClient.get<PricesResponse>(`/prices?${params.toString()}`, {
    skipAuth: true, // Prices are public
  });
}

/**
 * Get price history for charts
 * @param symbol - Token symbol (e.g., "USDC", "SOL")
 * @param days - Number of days (7, 30, 90, 365)
 * @param fiat - Fiat currency (default: USD)
 */
export async function getPriceHistory(
  symbol: string,
  days: 7 | 30 | 90 | 365 = 30,
  fiat: string = 'USD'
): Promise<PriceHistoryResponse> {
  const params = new URLSearchParams({
    symbol,
    days: days.toString(),
    fiat,
  });
  return apiClient.get<PriceHistoryResponse>(`/prices/history?${params.toString()}`, {
    skipAuth: true, // Prices are public
  });
}

