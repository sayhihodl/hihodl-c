// src/hooks/useWallets.ts
// Hook for fetching wallets from API
import { useState, useEffect, useCallback } from 'react';
import { listWallets } from '@/services/api/wallets.service';
import type { Wallet, ChainKey } from '@/types/api';

export interface UseWalletsOptions {
  chains?: ChainKey[];
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export interface UseWalletsResult {
  wallets: Wallet[];
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

/**
 * Hook to fetch and manage wallets from API
 */
export function useWallets(options: UseWalletsOptions = {}): UseWalletsResult {
  const { chains, autoRefresh = false, refreshInterval = 60000 } = options;
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchWallets = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const chainsParam = chains?.join(',');
      const data = await listWallets(chainsParam);
      setWallets(data);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch wallets');
      setError(error);
      console.error('[useWallets] Error fetching wallets:', error);
    } finally {
      setLoading(false);
    }
  }, [chains]);

  useEffect(() => {
    fetchWallets();
  }, [fetchWallets]);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchWallets();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchWallets]);

  return {
    wallets,
    loading,
    error,
    refresh: fetchWallets,
  };
}




