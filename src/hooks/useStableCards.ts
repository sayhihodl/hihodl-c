// src/hooks/useStableCards.ts
// Hook para manejar Stable Cards con estado y operaciones

import { useState, useEffect, useCallback } from 'react';
import {
  listStableCards,
  createStableCard,
  getStableCard,
  freezeStableCard,
  deleteStableCard,
  revealStableCardSecrets,
  updateStableCardLabel,
} from '@/services/api/stablecards.service';
import { ApiClientError } from '@/lib/apiClient';
import type {
  StableCard,
  CreateStableCardRequest,
  RevealStableCardSecretsResponse,
} from '@/types/api';

/**
 * Check if error is a backend database setup issue (table doesn't exist, pool closed, etc.)
 * These should be treated as "feature not available" rather than user-facing errors
 */
function isBackendSetupError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  
  const errorMessage = error.message.toLowerCase();
  const isTableMissing = 
    errorMessage.includes('stable_cards') && 
    (errorMessage.includes('does not exist') || errorMessage.includes('relation'));
  const isPoolError = 
    errorMessage.includes('pool') && 
    (errorMessage.includes('after calling end') || errorMessage.includes('closed'));
  
  // Also check if it's a 500 error from backend setup issues
  if (error instanceof ApiClientError) {
    const isServerError = error.status >= 500;
    return isServerError && (isTableMissing || isPoolError);
  }
  
  return isTableMissing || isPoolError;
}

export function useStableCards() {
  const [cards, setCards] = useState<StableCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const reload = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await listStableCards();
      setCards(data);
    } catch (err) {
      // If it's a backend setup error (table doesn't exist, pool issues),
      // treat it as feature not available - set empty cards, no error
      if (isBackendSetupError(err)) {
        setCards([]);
        setError(null);
        // Only log in development/debug mode, not as user-facing error
        if (__DEV__) {
          console.warn('Stable cards feature not available (backend setup):', err);
        }
      } else {
        // For actual errors, set error state
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        console.error('Failed to load stable cards:', error);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const requestCard = useCallback(
    async (params: CreateStableCardRequest): Promise<StableCard> => {
      try {
        setError(null);
        const newCard = await createStableCard(params);
        await reload(); // Reload to get updated list
        return newCard;
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        throw error;
      }
    },
    [reload]
  );

  const freeze = useCallback(
    async (cardId: string, freeze: boolean): Promise<void> => {
      try {
        setError(null);
        await freezeStableCard(cardId, freeze);
        await reload();
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        throw error;
      }
    },
    [reload]
  );

  const remove = useCallback(
    async (cardId: string): Promise<void> => {
      try {
        setError(null);
        await deleteStableCard(cardId);
        await reload();
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        throw error;
      }
    },
    [reload]
  );

  const reveal = useCallback(
    async (cardId: string): Promise<RevealStableCardSecretsResponse> => {
      try {
        setError(null);
        return await revealStableCardSecrets(cardId);
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        throw error;
      }
    },
    []
  );

  const rename = useCallback(
    async (cardId: string, label: string): Promise<void> => {
      try {
        setError(null);
        await updateStableCardLabel(cardId, label);
        await reload();
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        throw error;
      }
    },
    [reload]
  );

  const getCardDetails = useCallback(
    async (cardId: string) => {
      try {
        setError(null);
        return await getStableCard(cardId);
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        throw error;
      }
    },
    []
  );

  return {
    cards,
    loading,
    error,
    reload,
    requestCard,
    freeze,
    remove,
    reveal,
    rename,
    getCardDetails,
  };
}



