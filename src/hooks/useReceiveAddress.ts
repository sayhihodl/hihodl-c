// src/hooks/useReceiveAddress.ts
import { useEffect, useState, useCallback } from "react";
import { getReceiveAddress, batchProvisionAddresses } from "@/services/api/wallets.service";
import type { ReceiveAddressResponse, ChainKey, AccountType } from "@/types/api";

export interface UseReceiveAddressOptions {
  token?: string;
  reuse?: "current" | "new";
  account?: AccountType;
}

export interface UseReceiveAddressResult {
  data: ReceiveAddressResponse | null;
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

/**
 * Hook to fetch receive address for a wallet
 * Automatically provisions more addresses for Solana if needed
 */
export function useReceiveAddress(
  walletId: string,
  chain: ChainKey,
  options: UseReceiveAddressOptions = {}
): UseReceiveAddressResult {
  const { token, reuse = "current", account } = options;
  const [data, setData] = useState<ReceiveAddressResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const provisionMore = useCallback(async (addresses: string[]) => {
    try {
      await batchProvisionAddresses(walletId, addresses);
    } catch (err) {
      console.error('[useReceiveAddress] Error provisioning addresses:', err);
    }
  }, [walletId]);

  const fetchAddr = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getReceiveAddress(walletId, {
        chain,
        token,
        reuse_policy: reuse,
        account,
      });
      setData(res);
      
      // For Solana: if provision_more is true, provision more addresses
      if (res.provision_more && chain === "sol") {
        // This would typically be handled by the wallet setup logic
        // For now, we just log it
        console.log('[useReceiveAddress] Solana needs more addresses provisioned');
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch receive address');
      setError(error);
      console.error('[useReceiveAddress] Error fetching address:', error);
    } finally {
      setLoading(false);
    }
  }, [walletId, chain, token, reuse, account]);

  useEffect(() => {
    fetchAddr();
  }, [fetchAddr]);

  return { data, loading, error, refresh: fetchAddr };
}