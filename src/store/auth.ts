// src/store/auth.ts
// Improved authentication store using Supabase
import { create } from 'zustand';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { User, Session } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';

export type AuthMethod = 'email' | 'google' | 'apple' | 'passkey';

export type AuthState = {
  user: User | null;
  session: Session | null;
  authMethod: AuthMethod | null;
  ready: boolean;
  isLoading: boolean;
  error: string | null;
};

export type AuthActions = {
  setUser: (user: User | null, session: Session | null, method?: AuthMethod) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearAuth: () => Promise<void>;
  refreshSession: () => Promise<void>;
};

const SESSION_KEY = 'supabase_session';

export const useAuthStore = create<AuthState & AuthActions>((set, get) => ({
  // Initial state
  user: null,
  session: null,
  authMethod: null,
  ready: false,
  isLoading: false,
  error: null,

  // Actions
  setUser: (user, session, method = null) => {
    set({ user, session, authMethod: method });
    // Persist session if exists
    if (session) {
      SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(session)).catch(
        console.warn
      );
    }
  },

  setLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error }),

  clearAuth: async () => {
    await supabase.auth.signOut();
    await SecureStore.deleteItemAsync(SESSION_KEY);
    set({
      user: null,
      session: null,
      authMethod: null,
      error: null,
    });
  },

  refreshSession: async () => {
    try {
      const {
        data: { session },
        error,
      } = await supabase.auth.refreshSession();
      if (error) throw error;
      if (session) {
        get().setUser(session.user, session, get().authMethod);
      }
    } catch (error) {
      console.error('Failed to refresh session:', error);
      get().setError(error instanceof Error ? error.message : 'Failed to refresh session');
    }
  },
}));

// Initialize auth state listener
// Check if Supabase is configured before setting up listener
if (isSupabaseConfigured()) {
  supabase.auth.onAuthStateChange((event, session) => {
    const { setUser, setLoading } = useAuthStore.getState();
    
    switch (event) {
      case 'INITIAL_SESSION':
        setUser(session?.user ?? null, session ?? null);
        useAuthStore.setState({ ready: true });
        break;
      case 'SIGNED_IN':
        setUser(session?.user ?? null, session ?? null);
        setLoading(false);
        break;
      case 'SIGNED_OUT':
        setUser(null, null);
        setLoading(false);
        break;
      case 'TOKEN_REFRESHED':
        setUser(session?.user ?? null, session ?? null);
        break;
      case 'USER_UPDATED':
        setUser(session?.user ?? null, session ?? null);
        break;
    }
  });
} else {
  // If not configured, mark as ready but no user
  // Auth operations will fail gracefully
  useAuthStore.setState({ ready: true });
}

// Hook for easy access
export const useAuth = () => {
  const { user, session, authMethod, ready, isLoading, error } = useAuthStore();
  return {
    user,
    session,
    authMethod,
    ready,
    isLoading,
    error,
    isAuthenticated: !!user && !!session,
  };
};

