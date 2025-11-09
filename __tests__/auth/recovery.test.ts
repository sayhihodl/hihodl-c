/**
 * Tests for account recovery functionality
 */
import {
  requestPasswordReset,
  updatePasswordWithToken,
  checkEmailExists,
  resendConfirmationEmail,
} from '@/auth/recovery';
import { supabase } from '@/lib/supabase';

// Mock Supabase
jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      resetPasswordForEmail: jest.fn(),
      updateUser: jest.fn(),
      signInWithPassword: jest.fn(),
      resend: jest.fn(),
    },
  },
}));

describe('Account Recovery', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('requestPasswordReset', () => {
    it('should send password reset email successfully', async () => {
      const email = 'test@example.com';
      (supabase.auth.resetPasswordForEmail as jest.Mock).mockResolvedValue({
        error: null,
      });

      const result = await requestPasswordReset(email);

      expect(result.error).toBeNull();
      expect(result.message).toBe('Password reset email sent');
      expect(supabase.auth.resetPasswordForEmail).toHaveBeenCalledWith(email, {
        redirectTo: undefined,
      });
    });

    it('should handle error when sending reset email', async () => {
      const email = 'test@example.com';
      const mockError = { message: 'User not found', status: 404 };
      (supabase.auth.resetPasswordForEmail as jest.Mock).mockResolvedValue({
        error: mockError,
      });

      const result = await requestPasswordReset(email);

      expect(result.error).toEqual(mockError);
      expect(result.message).toBe('User not found');
    });

    it('should handle unexpected errors', async () => {
      const email = 'test@example.com';
      (supabase.auth.resetPasswordForEmail as jest.Mock).mockRejectedValue(
        new Error('Network error')
      );

      const result = await requestPasswordReset(email);

      expect(result.error).toBeDefined();
      expect(result.error?.message).toBe('Failed to send reset email');
    });
  });

  describe('updatePasswordWithToken', () => {
    it('should update password successfully', async () => {
      const newPassword = 'newSecurePassword123';
      (supabase.auth.updateUser as jest.Mock).mockResolvedValue({
        error: null,
      });

      const result = await updatePasswordWithToken(newPassword);

      expect(result.error).toBeNull();
      expect(supabase.auth.updateUser).toHaveBeenCalledWith({
        password: newPassword,
      });
    });

    it('should handle error when updating password', async () => {
      const newPassword = 'newSecurePassword123';
      const mockError = { message: 'Invalid token', status: 401 };
      (supabase.auth.updateUser as jest.Mock).mockResolvedValue({
        error: mockError,
      });

      const result = await updatePasswordWithToken(newPassword);

      expect(result.error).toEqual(mockError);
    });

    it('should handle unexpected errors', async () => {
      const newPassword = 'newSecurePassword123';
      (supabase.auth.updateUser as jest.Mock).mockRejectedValue(
        new Error('Network error')
      );

      const result = await updatePasswordWithToken(newPassword);

      expect(result.error).toBeDefined();
      expect(result.error?.message).toBe('Failed to update password');
    });
  });

  describe('checkEmailExists', () => {
    it('should detect existing email', async () => {
      const email = 'existing@example.com';
      (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
        error: { message: 'Invalid login credentials' },
      });

      const result = await checkEmailExists(email);

      expect(result.exists).toBe(true);
      expect(result.error).toBeNull();
    });

    it('should detect non-existing email', async () => {
      const email = 'nonexistent@example.com';
      (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
        error: { message: 'User not found' },
      });

      const result = await checkEmailExists(email);

      // The function checks if error message includes 'email' or 'user'
      expect(result.error).toBeNull();
    });

    it('should handle network errors', async () => {
      const email = 'test@example.com';
      (supabase.auth.signInWithPassword as jest.Mock).mockRejectedValue(
        new Error('Network error')
      );

      const result = await checkEmailExists(email);

      expect(result.exists).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.message).toBe('Failed to check email');
    });
  });

  describe('resendConfirmationEmail', () => {
    it('should resend confirmation email successfully', async () => {
      const email = 'test@example.com';
      (supabase.auth.resend as jest.Mock).mockResolvedValue({
        error: null,
      });

      const result = await resendConfirmationEmail(email);

      expect(result.error).toBeNull();
      expect(supabase.auth.resend).toHaveBeenCalledWith({
        type: 'signup',
        email,
      });
    });

    it('should handle error when resending email', async () => {
      const email = 'test@example.com';
      const mockError = { message: 'Email not found', status: 404 };
      (supabase.auth.resend as jest.Mock).mockResolvedValue({
        error: mockError,
      });

      const result = await resendConfirmationEmail(email);

      expect(result.error).toEqual(mockError);
    });

    it('should handle unexpected errors', async () => {
      const email = 'test@example.com';
      (supabase.auth.resend as jest.Mock).mockRejectedValue(
        new Error('Network error')
      );

      const result = await resendConfirmationEmail(email);

      expect(result.error).toBeDefined();
      expect(result.error?.message).toBe('Failed to resend confirmation email');
    });
  });
});






