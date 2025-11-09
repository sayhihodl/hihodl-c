/**
 * Tests for authentication error utilities
 */
import {
  normalizeAuthError,
  getAuthErrorMessage,
  isRetryableError,
  type NormalizedAuthError,
} from '@/utils/auth-errors';
import type { AuthError } from '@supabase/supabase-js';

describe('Auth Error Utilities', () => {
  describe('normalizeAuthError', () => {
    it('should handle null error', () => {
      const result = normalizeAuthError(null);
      
      expect(result.code).toBe('UNKNOWN_ERROR');
      expect(result.message).toBe('An unknown error occurred');
      expect(result.originalError).toBeInstanceOf(Error);
    });

    it('should normalize invalid credentials error', () => {
      const error = { message: 'Invalid login credentials' } as AuthError;
      const result = normalizeAuthError(error);
      
      expect(result.code).toBe('INVALID_CREDENTIALS');
      expect(result.message).toContain('Invalid email or password');
      expect(result.originalError).toBe(error);
    });

    it('should normalize email already exists error', () => {
      const error = { message: 'User already registered' } as AuthError;
      const result = normalizeAuthError(error);
      
      expect(result.code).toBe('EMAIL_ALREADY_EXISTS');
      expect(result.message).toContain('already exists');
      expect(result.originalError).toBe(error);
    });

    it('should normalize weak password error', () => {
      const error = { message: 'Password should be at least 8 characters' } as AuthError;
      const result = normalizeAuthError(error);
      
      expect(result.code).toBe('WEAK_PASSWORD');
      expect(result.message).toContain('too weak');
      expect(result.originalError).toBe(error);
    });

    it('should normalize invalid email error', () => {
      const error = { message: 'Invalid email address' } as AuthError;
      const result = normalizeAuthError(error);
      
      expect(result.code).toBe('INVALID_EMAIL');
      expect(result.message).toContain('valid email');
      expect(result.originalError).toBe(error);
    });

    it('should normalize rate limit error (status 429)', () => {
      const error = { message: 'Too many requests', status: 429 } as AuthError;
      const result = normalizeAuthError(error);
      
      expect(result.code).toBe('TOO_MANY_REQUESTS');
      expect(result.message).toContain('Too many attempts');
      expect(result.originalError).toBe(error);
    });

    it('should normalize network error', () => {
      const error = { message: 'Network request failed' } as AuthError;
      const result = normalizeAuthError(error);
      
      expect(result.code).toBe('NETWORK_ERROR');
      expect(result.message).toContain('Network error');
      expect(result.originalError).toBe(error);
    });

    it('should handle unknown error', () => {
      const error = { message: 'Some unexpected error' } as AuthError;
      const result = normalizeAuthError(error);
      
      expect(result.code).toBe('UNKNOWN_ERROR');
      expect(result.message).toBe('Some unexpected error');
      expect(result.originalError).toBe(error);
    });

    it('should handle Error object', () => {
      const error = new Error('Custom error message');
      const result = normalizeAuthError(error);
      
      expect(result.code).toBe('UNKNOWN_ERROR');
      expect(result.message).toBe('Custom error message');
      expect(result.originalError).toBe(error);
    });
  });

  describe('getAuthErrorMessage', () => {
    it('should return user-friendly message', () => {
      const error = { message: 'Invalid login credentials' } as AuthError;
      const message = getAuthErrorMessage(error);
      
      expect(message).toContain('Invalid email or password');
    });

    it('should handle null', () => {
      const message = getAuthErrorMessage(null);
      
      expect(message).toBe('An unknown error occurred');
    });
  });

  describe('isRetryableError', () => {
    it('should return true for network errors', () => {
      const error = { message: 'Network request failed' } as AuthError;
      expect(isRetryableError(error)).toBe(true);
    });

    it('should return true for rate limit errors', () => {
      const error = { message: 'Too many requests', status: 429 } as AuthError;
      expect(isRetryableError(error)).toBe(true);
    });

    it('should return false for invalid credentials', () => {
      const error = { message: 'Invalid login credentials' } as AuthError;
      expect(isRetryableError(error)).toBe(false);
    });

    it('should return false for unknown errors', () => {
      const error = { message: 'Some error' } as AuthError;
      expect(isRetryableError(error)).toBe(false);
    });

    it('should return false for null', () => {
      expect(isRetryableError(null)).toBe(false);
    });
  });
});

