// src/auth/email.ts
// Email/password authentication with Supabase
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/auth';
import type { AuthError } from '@supabase/supabase-js';

export interface SignUpResult {
  user: any;
  session: any;
  error: AuthError | null;
}

export interface SignInResult {
  user: any;
  session: any;
  error: AuthError | null;
}

/**
 * Sign up with email and password
 */
export async function signUpWithEmail(
  email: string,
  password: string,
  metadata?: Record<string, any>
): Promise<SignUpResult> {
  const { setLoading, setError } = useAuthStore.getState();
  setLoading(true);
  setError(null);

  try {
    // Check if Supabase is configured
    const { isSupabaseConfigured } = await import('@/lib/supabase');
    if (!isSupabaseConfigured()) {
      const message = 'Supabase is not configured. Please set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY';
      setError(message);
      return {
        user: null,
        session: null,
        error: { message, status: 500 } as AuthError,
      };
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata || {},
        emailRedirectTo: undefined, // Can be set for email verification links
      },
    });

    if (error) {
      setError(error.message);
      return { user: null, session: null, error };
    }

    // Auth state change will update the store automatically
    const { setUser } = useAuthStore.getState();
    setUser(data.user, data.session ?? null, 'email');

    return { user: data.user, session: data.session, error: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    setError(message);
    return {
      user: null,
      session: null,
      error: { message, status: 500 } as AuthError,
    };
  } finally {
    setLoading(false);
  }
}

/**
 * Sign in with email and password
 */
export async function signInWithEmail(
  email: string,
  password: string
): Promise<SignInResult> {
  const { setLoading, setError } = useAuthStore.getState();
  setLoading(true);
  setError(null);

  try {
    // Check if Supabase is configured
    const { isSupabaseConfigured } = await import('@/lib/supabase');
    if (!isSupabaseConfigured()) {
      const message = 'Supabase is not configured. Please set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY';
      setError(message);
      return {
        user: null,
        session: null,
        error: { message, status: 500 } as AuthError,
      };
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      return { user: null, session: null, error };
    }

    // Auth state change will update the store automatically
    const { setUser } = useAuthStore.getState();
    setUser(data.user, data.session, 'email');

    return { user: data.user, session: data.session, error: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    setError(message);
    return {
      user: null,
      session: null,
      error: { message, status: 500 } as AuthError,
    };
  } finally {
    setLoading(false);
  }
}

/**
 * Send password reset email
 */
export async function resetPassword(email: string): Promise<{ error: AuthError | null }> {
  const { setError } = useAuthStore.getState();
  setError(null);

  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: undefined, // Can be set to a deep link URL
    });

    if (error) {
      setError(error.message);
      return { error };
    }

    return { error: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    setError(message);
    return { error: { message, status: 500 } as AuthError };
  }
}

/**
 * Update password
 */
export async function updatePassword(
  newPassword: string
): Promise<{ error: AuthError | null }> {
  const { setError } = useAuthStore.getState();
  setError(null);

  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      setError(error.message);
      return { error };
    }

    return { error: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    setError(message);
    return { error: { message, status: 500 } as AuthError };
  }
}

/**
 * Sign out
 */
export async function signOut(): Promise<void> {
  const { clearAuth } = useAuthStore.getState();
  await clearAuth();
}

