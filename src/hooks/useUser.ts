// src/hooks/useUser.ts
// Hook for fetching current user from API
import { useState, useEffect, useCallback } from 'react';
import { getMe, updateProfile } from '@/services/api/auth.service';
import type { User, UserProfile } from '@/types/api';

export interface UseUserResult {
  user: User | null;
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
  updateUserProfile: (profile: Partial<UserProfile>) => Promise<void>;
}

/**
 * Hook to fetch and manage current user from API
 */
export function useUser(): UseUserResult {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchUser = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getMe();
      setUser(data);
    } catch (err: any) {
      // Silently handle 401 (Unauthorized) - user is not authenticated, which is expected
      if (err?.status === 401 || err?.code === 'UNAUTHORIZED') {
        setUser(null);
        setError(null); // Don't set error for expected unauthenticated state
        return;
      }
      
      // For other errors, log and set error state
      const error = err instanceof Error ? err : new Error('Failed to fetch user');
      setError(error);
      console.error('[useUser] Error fetching user:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateUserProfile = useCallback(async (profile: Partial<UserProfile>) => {
    try {
      setError(null);
      const updated = await updateProfile(profile);
      setUser(updated);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to update profile');
      setError(error);
      console.error('[useUser] Error updating profile:', error);
      throw error;
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  return {
    user,
    loading,
    error,
    refresh: fetchUser,
    updateUserProfile,
  };
}




