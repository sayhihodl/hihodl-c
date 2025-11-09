// src/utils/auth-errors.ts
// Utility functions for handling authentication errors
import type { AuthError } from '@supabase/supabase-js';

export type AuthErrorCode =
  | 'INVALID_CREDENTIALS'
  | 'EMAIL_ALREADY_EXISTS'
  | 'WEAK_PASSWORD'
  | 'INVALID_EMAIL'
  | 'TOO_MANY_REQUESTS'
  | 'NETWORK_ERROR'
  | 'UNKNOWN_ERROR';

export interface NormalizedAuthError {
  code: AuthErrorCode;
  message: string;
  originalError: AuthError | Error;
}

/**
 * Normalize Supabase auth errors to user-friendly messages
 */
export function normalizeAuthError(error: AuthError | Error | null): NormalizedAuthError {
  if (!error) {
    return {
      code: 'UNKNOWN_ERROR',
      message: 'An unknown error occurred',
      originalError: new Error('Unknown error'),
    };
  }

  const message = error.message || 'An error occurred';
  const status = 'status' in error ? error.status : undefined;

  // Supabase specific error codes
  if (message.includes('Invalid login credentials') || message.includes('Invalid credentials')) {
    return {
      code: 'INVALID_CREDENTIALS',
      message: 'Invalid email or password. Please check your credentials and try again.',
      originalError: error,
    };
  }

  if (message.includes('User already registered') || message.includes('already registered')) {
    return {
      code: 'EMAIL_ALREADY_EXISTS',
      message: 'An account with this email already exists. Please sign in instead.',
      originalError: error,
    };
  }

  if (message.includes('Password should be at least') || message.includes('weak password')) {
    return {
      code: 'WEAK_PASSWORD',
      message: 'Password is too weak. Please use a stronger password (at least 8 characters).',
      originalError: error,
    };
  }

  if (message.includes('Invalid email') || message.includes('email address')) {
    return {
      code: 'INVALID_EMAIL',
      message: 'Please enter a valid email address.',
      originalError: error,
    };
  }

  if (status === 429 || message.includes('too many requests')) {
    return {
      code: 'TOO_MANY_REQUESTS',
      message: 'Too many attempts. Please wait a moment and try again.',
      originalError: error,
    };
  }

  if (message.includes('Network') || message.includes('fetch')) {
    return {
      code: 'NETWORK_ERROR',
      message: 'Network error. Please check your connection and try again.',
      originalError: error,
    };
  }

  return {
    code: 'UNKNOWN_ERROR',
    message: message || 'An unexpected error occurred. Please try again.',
    originalError: error,
  };
}

/**
 * Get user-friendly error message
 */
export function getAuthErrorMessage(error: AuthError | Error | null): string {
  return normalizeAuthError(error).message;
}

/**
 * Check if error is retryable
 */
export function isRetryableError(error: AuthError | Error | null): boolean {
  const normalized = normalizeAuthError(error);
  return normalized.code === 'NETWORK_ERROR' || normalized.code === 'TOO_MANY_REQUESTS';
}

