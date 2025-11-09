// src/hooks/useTransfers.ts
// Hook for fetching transfers from API
import { useState, useEffect, useCallback } from 'react';
import { listTransfers, getTransfer } from '@/services/api/transfers.service';
import type { Transfer, ChainKey, TransferStatus } from '@/types/api';

export interface UseTransfersOptions {
  chain?: ChainKey;
  status?: TransferStatus;
  limit?: number;
  offset?: number;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export interface UseTransfersResult {
  transfers: Transfer[];
  loading: boolean;
  error: Error | null;
  hasMore: boolean;
  total: number;
  refresh: () => Promise<void>;
  loadMore: () => Promise<void>;
}

/**
 * Hook to fetch and manage transfers from API
 */
export function useTransfers(options: UseTransfersOptions = {}): UseTransfersResult {
  const {
    chain,
    status,
    limit = 20,
    offset: initialOffset = 0,
    autoRefresh = false,
    refreshInterval = 30000,
  } = options;
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(initialOffset);

  const fetchTransfers = useCallback(
    async (currentOffset: number = 0, append: boolean = false) => {
      try {
        setLoading(true);
        setError(null);
        const result = await listTransfers({
          chain,
          status,
          limit,
          offset: currentOffset,
        });
        setTransfers((prev) => (append ? [...prev, ...result.transfers] : result.transfers));
        setHasMore(result.hasMore);
        setTotal(result.total);
        setOffset(currentOffset + result.transfers.length);
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Failed to fetch transfers');
        setError(error);
        console.error('[useTransfers] Error fetching transfers:', error);
      } finally {
        setLoading(false);
      }
    },
    [chain, status, limit]
  );

  const loadMore = useCallback(async () => {
    if (!hasMore || loading) return;
    await fetchTransfers(offset, true);
  }, [hasMore, loading, offset, fetchTransfers]);

  useEffect(() => {
    fetchTransfers(0, false);
  }, [fetchTransfers]);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchTransfers(0, false);
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchTransfers]);

  return {
    transfers,
    loading,
    error,
    hasMore,
    total,
    refresh: () => fetchTransfers(0, false),
    loadMore,
  };
}




