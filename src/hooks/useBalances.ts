// src/hooks/useBalances.ts
// Hook for fetching balances from API
import { useState, useEffect, useCallback } from 'react';
import { getBalances } from '@/services/api/balances.service';
import type { Balance, AccountType, ChainKey } from '@/types/api';

export interface UseBalancesOptions {
  chains?: ChainKey[];
  account?: AccountType;
  autoRefresh?: boolean;
  refreshInterval?: number; // in milliseconds
}

export interface UseBalancesResult {
  balances: Balance[];
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

/**
 * Hook to fetch and manage balances from API
 */
export function useBalances(options: UseBalancesOptions = {}): UseBalancesResult {
  const { chains, account, autoRefresh = false, refreshInterval = 30000 } = options;
  const [balances, setBalances] = useState<Balance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchBalances = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const chainsParam = chains?.join(',');
      const data = await getBalances(chainsParam, account);
      setBalances(data);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch balances');
      setError(error);
      console.error('[useBalances] Error fetching balances:', error);
    } finally {
      setLoading(false);
    }
  }, [chains, account]);

  useEffect(() => {
    fetchBalances();
  }, [fetchBalances]);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchBalances();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchBalances]);

  return {
    balances,
    loading,
    error,
    refresh: fetchBalances,
  };
}




