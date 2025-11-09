// src/auth/recovery.ts
// Account recovery and password reset functionality
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/auth';
import type { AuthError } from '@supabase/supabase-js';

/**
 * Send password reset email
 */
export async function requestPasswordReset(
  email: string
): Promise<{ error: AuthError | null; message?: string }> {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: undefined, // Can be configured for deep linking
    });

    if (error) {
      return { error, message: error.message };
    }

    return { error: null, message: 'Password reset email sent' };
  } catch (error) {
    return {
      error: { message: 'Failed to send reset email', status: 500 } as AuthError,
    };
  }
}

/**
 * Update password after reset (using recovery token)
 */
export async function updatePasswordWithToken(
  newPassword: string
): Promise<{ error: AuthError | null }> {
  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      return { error };
    }

    return { error: null };
  } catch (error) {
    return {
      error: { message: 'Failed to update password', status: 500 } as AuthError,
    };
  }
}

/**
 * Check if email exists
 */
export async function checkEmailExists(
  email: string
): Promise<{ exists: boolean; error: AuthError | null }> {
  try {
    // Supabase doesn't have a direct "check email" endpoint
    // We can try to sign in and check the error
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: '__dummy__', // Will fail but tells us if email exists
    });

    // If error is "Invalid login credentials", email might exist
    // If error is "Email not confirmed" or similar, email exists
    // If error is something else, we can't be sure
    if (error) {
      const exists = error.message.includes('email') || error.message.includes('user');
      return { exists, error: null };
    }

    // If no error, email definitely exists (but this shouldn't happen with dummy password)
    return { exists: true, error: null };
  } catch (error) {
    return {
      exists: false,
      error: { message: 'Failed to check email', status: 500 } as AuthError,
    };
  }
}

/**
 * Resend email confirmation
 */
export async function resendConfirmationEmail(
  email: string
): Promise<{ error: AuthError | null }> {
  try {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
    });

    if (error) {
      return { error };
    }

    return { error: null };
  } catch (error) {
    return {
      error: { message: 'Failed to resend confirmation email', status: 500 } as AuthError,
    };
  }
}

