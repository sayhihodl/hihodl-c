// src/hooks/useHasAccounts.ts
import { useState, useEffect } from 'react';
import { getWalletsMeta } from '@/lib/walletsetup';

/**
 * Hook para verificar si el usuario tiene cuentas creadas
 * @returns { hasAccounts: boolean, isLoading: boolean }
 */
export function useHasAccounts() {
  const [hasAccounts, setHasAccounts] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const checkAccounts = async () => {
      try {
        const meta = await getWalletsMeta();
        setHasAccounts(meta !== null && Array.isArray(meta) && meta.length > 0);
      } catch (error) {
        console.error('[useHasAccounts] Error checking accounts:', error);
        setHasAccounts(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAccounts();
  }, []);

  return { hasAccounts, isLoading };
}

