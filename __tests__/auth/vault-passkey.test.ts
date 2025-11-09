/**
 * Tests for vault-passkey integration
 */
import {
  unlockVaultWithPasskey,
  createVaultWithPasskey,
} from '@/auth/vault-passkey';
import { createOrUnlockVault, changePassphrase } from '@/lib/vault';
import { signInWithPasskey } from '@/auth/passkeys';
import { useAuth } from '@/store/auth';

// Mock dependencies
jest.mock('@/lib/vault');
jest.mock('@/auth/passkeys');
jest.mock('@/store/auth');

describe('Vault-Passkey Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('unlockVaultWithPasskey', () => {
    it('should unlock vault successfully with passkey', async () => {
      const email = 'test@example.com';
      const mockUser = { id: 'user-123' };
      const mockSession = { access_token: 'token-123' };
      const mockMnemonic = 'test mnemonic phrase';

      (useAuth as jest.Mock).mockReturnValue({
        user: mockUser,
        session: mockSession,
      });

      (signInWithPasskey as jest.Mock).mockResolvedValue({
        error: null,
      });

      (createOrUnlockVault as jest.Mock).mockResolvedValue({
        mnemonic: mockMnemonic,
        created: false,
      });

      const result = await unlockVaultWithPasskey(email);

      expect(result.error).toBeNull();
      expect(result.mnemonic).toBe(mockMnemonic);
      expect(signInWithPasskey).toHaveBeenCalledWith(email);
      expect(createOrUnlockVault).toHaveBeenCalled();
    });

    it('should return error when user is not authenticated', async () => {
      const email = 'test@example.com';

      (useAuth as jest.Mock).mockReturnValue({
        user: null,
        session: null,
      });

      const result = await unlockVaultWithPasskey(email);

      expect(result.error).toBeDefined();
      expect(result.error?.message).toBe('User not authenticated');
      expect(result.mnemonic).toBeNull();
    });

    it('should return error when passkey auth fails', async () => {
      const email = 'test@example.com';
      const mockUser = { id: 'user-123' };

      (useAuth as jest.Mock).mockReturnValue({
        user: mockUser,
      });

      (signInWithPasskey as jest.Mock).mockResolvedValue({
        error: new Error('Passkey authentication failed'),
      });

      const result = await unlockVaultWithPasskey(email);

      expect(result.error).toBeDefined();
      expect(result.error?.message).toBe('Passkey authentication failed');
      expect(result.mnemonic).toBeNull();
    });

    it('should return error when session is missing after passkey auth', async () => {
      const email = 'test@example.com';
      const mockUser = { id: 'user-123' };

      (useAuth as jest.Mock)
        .mockReturnValueOnce({
          user: mockUser,
          session: null,
        })
        .mockReturnValueOnce({
          user: mockUser,
          session: null,
        });

      (signInWithPasskey as jest.Mock).mockResolvedValue({
        error: null,
      });

      const result = await unlockVaultWithPasskey(email);

      expect(result.error).toBeDefined();
      expect(result.error?.message).toBe('No session after passkey auth');
      expect(result.mnemonic).toBeNull();
    });

    it('should handle unexpected errors', async () => {
      const email = 'test@example.com';
      const mockUser = { id: 'user-123' };

      (useAuth as jest.Mock).mockReturnValue({
        user: mockUser,
        session: { access_token: 'token-123' },
      });

      (signInWithPasskey as jest.Mock).mockRejectedValue(
        new Error('Network error')
      );

      const result = await unlockVaultWithPasskey(email);

      expect(result.error).toBeDefined();
      expect(result.error?.message).toBe('Failed to unlock vault');
      expect(result.mnemonic).toBeNull();
    });
  });

  describe('createVaultWithPasskey', () => {
    it('should create vault successfully with passkey', async () => {
      const email = 'test@example.com';
      const mnemonicFactory = jest.fn(() => 'new mnemonic phrase');
      const mockUser = { id: 'user-123' };
      const mockSession = { access_token: 'token-123' };

      (useAuth as jest.Mock).mockReturnValue({
        user: mockUser,
        session: mockSession,
      });

      (signInWithPasskey as jest.Mock).mockResolvedValue({
        error: null,
      });

      (createOrUnlockVault as jest.Mock).mockResolvedValue({
        mnemonic: 'new mnemonic phrase',
        created: true,
      });

      const result = await createVaultWithPasskey(email, mnemonicFactory);

      expect(result.error).toBeNull();
      expect(result.mnemonic).toBe('new mnemonic phrase');
      expect(signInWithPasskey).toHaveBeenCalledWith(email);
      expect(createOrUnlockVault).toHaveBeenCalled();
    });

    it('should return error when user is not authenticated', async () => {
      const email = 'test@example.com';
      const mnemonicFactory = jest.fn(() => 'mnemonic');

      (useAuth as jest.Mock).mockReturnValue({
        user: null,
        session: null,
      });

      const result = await createVaultWithPasskey(email, mnemonicFactory);

      expect(result.error).toBeDefined();
      expect(result.error?.message).toBe('User not authenticated');
      expect(result.mnemonic).toBeNull();
    });

    it('should handle passkey registration failure', async () => {
      const email = 'test@example.com';
      const mnemonicFactory = jest.fn(() => 'mnemonic');
      const mockUser = { id: 'user-123' };

      (useAuth as jest.Mock).mockReturnValue({
        user: mockUser,
      });

      (signInWithPasskey as jest.Mock).mockResolvedValue({
        error: new Error('Failed to register passkey'),
      });

      const result = await createVaultWithPasskey(email, mnemonicFactory);

      expect(result.error).toBeDefined();
      expect(result.error?.message).toBe('Failed to register passkey');
      expect(result.mnemonic).toBeNull();
    });

    it('should handle vault creation failure', async () => {
      const email = 'test@example.com';
      const mnemonicFactory = jest.fn(() => 'mnemonic');
      const mockUser = { id: 'user-123' };
      const mockSession = { access_token: 'token-123' };

      (useAuth as jest.Mock)
        .mockReturnValueOnce({
          user: mockUser,
          session: mockSession,
        })
        .mockReturnValueOnce({
          user: mockUser,
          session: mockSession,
        });

      (signInWithPasskey as jest.Mock).mockResolvedValue({
        error: null,
      });

      (createOrUnlockVault as jest.Mock).mockRejectedValue(
        new Error('Vault creation failed')
      );

      const result = await createVaultWithPasskey(email, mnemonicFactory);

      expect(result.error).toBeDefined();
      expect(result.error?.message).toBe('Vault creation failed');
      expect(result.mnemonic).toBeNull();
    });
  });
});






