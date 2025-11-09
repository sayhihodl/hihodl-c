/**
 * Tests for authentication store (Zustand)
 */
import { useAuthStore } from '@/store/auth';
import * as SecureStore from 'expo-secure-store';

// Mock SecureStore
jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(() => Promise.resolve()),
  getItemAsync: jest.fn(() => Promise.resolve(null)),
  deleteItemAsync: jest.fn(() => Promise.resolve()),
}));

describe('Auth Store', () => {
  beforeEach(() => {
    // Reset store state
    useAuthStore.getState().clearAuth();
    jest.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should have correct initial state', () => {
      const state = useAuthStore.getState();
      
      expect(state.user).toBeNull();
      expect(state.session).toBeNull();
      expect(state.authMethod).toBeNull();
      expect(state.ready).toBe(false);
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });
  });

  describe('setUser', () => {
    it('should set user and session', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        created_at: '2024-01-01T00:00:00Z',
      } as any;
      
      const mockSession = {
        access_token: 'token-123',
        refresh_token: 'refresh-123',
        user: mockUser,
      } as any;
      
      useAuthStore.getState().setUser(mockUser, mockSession, 'email');
      
      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 0));
      
      const state = useAuthStore.getState();
      expect(state.user).toEqual(mockUser);
      expect(state.session).toEqual(mockSession);
      expect(state.authMethod).toBe('email');
    });

    it('should persist session to SecureStore', async () => {
      const mockUser = { id: 'user-456', email: 'test2@example.com' } as any;
      const mockSession = {
        access_token: 'token-456',
        refresh_token: 'refresh-456',
        user: mockUser,
      } as any;
      
      const setItemSpy = jest.spyOn(SecureStore, 'setItemAsync');
      
      useAuthStore.getState().setUser(mockUser, mockSession, 'google');
      
      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 0));
      
      expect(setItemSpy).toHaveBeenCalledWith(
        'supabase_session',
        JSON.stringify(mockSession)
      );
    });

    it('should not persist if session is null', () => {
      const setItemSpy = jest.spyOn(SecureStore, 'setItemAsync');
      
      useAuthStore.getState().setUser(null, null);
      
      expect(setItemSpy).not.toHaveBeenCalled();
    });
  });

  describe('setLoading', () => {
    it('should set loading state', () => {
      useAuthStore.getState().setLoading(true);
      expect(useAuthStore.getState().isLoading).toBe(true);
      
      useAuthStore.getState().setLoading(false);
      expect(useAuthStore.getState().isLoading).toBe(false);
    });
  });

  describe('setError', () => {
    it('should set error message', () => {
      useAuthStore.getState().setError('Something went wrong');
      expect(useAuthStore.getState().error).toBe('Something went wrong');
      
      useAuthStore.getState().setError(null);
      expect(useAuthStore.getState().error).toBeNull();
    });
  });

  describe('clearAuth', () => {
    it('should clear user, session, and error', async () => {
      // Set some state first
      const mockUser = { id: 'user-789', email: 'test3@example.com' } as any;
      const mockSession = { access_token: 'token-789', user: mockUser } as any;
      
      useAuthStore.getState().setUser(mockUser, mockSession, 'email');
      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 0));
      
      useAuthStore.getState().setError('Some error');
      
      // Clear
      await useAuthStore.getState().clearAuth();
      
      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.session).toBeNull();
      expect(state.authMethod).toBeNull();
      expect(state.error).toBeNull();
    });

    it('should delete session from SecureStore', async () => {
      const deleteItemSpy = jest.spyOn(SecureStore, 'deleteItemAsync');
      
      await useAuthStore.getState().clearAuth();
      
      expect(deleteItemSpy).toHaveBeenCalledWith('supabase_session');
    });
  });

  describe('useAuth hook', () => {
    it('should return isAuthenticated as true when user and session exist', async () => {
      const mockUser = { id: 'user-999', email: 'test4@example.com' } as any;
      const mockSession = { access_token: 'token-999', user: mockUser } as any;
      
      useAuthStore.getState().setUser(mockUser, mockSession, 'email');
      
      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 0));
      
      // Note: useAuth is a hook and needs to be tested differently
      // For now, we test the logic directly
      const state = useAuthStore.getState();
      const isAuthenticated = !!(state.user && state.session);
      
      expect(isAuthenticated).toBe(true);
    });

    it('should return isAuthenticated as false when user or session is null', () => {
      useAuthStore.getState().clearAuth();
      
      const state = useAuthStore.getState();
      const isAuthenticated = !!(state.user && state.session);
      
      expect(isAuthenticated).toBe(false);
    });
  });
});

