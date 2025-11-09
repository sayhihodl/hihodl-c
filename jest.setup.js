// Jest setup file
import 'react-native-get-random-values';
import { jest } from '@jest/globals';

// Mock expo-secure-store
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

// Mock expo-local-authentication
jest.mock('expo-local-authentication', () => ({
  hasHardwareAsync: jest.fn(() => Promise.resolve(true)),
  isEnrolledAsync: jest.fn(() => Promise.resolve(true)),
  authenticateAsync: jest.fn(() => Promise.resolve({ success: true })),
}));

// Mock Supabase client
jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      signOut: jest.fn(() => Promise.resolve({ error: null })),
      refreshSession: jest.fn(() => Promise.resolve({ data: { session: null }, error: null })),
      onAuthStateChange: jest.fn(() => ({ data: { subscription: null }, unsubscribe: jest.fn() })),
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          eq: jest.fn(() => ({
            single: jest.fn(() => Promise.resolve({ data: null, error: { code: 'PGRST116' } })),
          })),
        })),
      })),
      insert: jest.fn(() => Promise.resolve({ error: null })),
      update: jest.fn(() => ({
        eq: jest.fn(() => Promise.resolve({ error: null })),
      })),
    })),
  },
  isSupabaseConfigured: jest.fn(() => true),
}));

// Mock crypto.subtle if not available
if (typeof crypto === 'undefined' || !crypto.subtle) {
  global.crypto = {
    ...global.crypto,
    subtle: {
      importKey: jest.fn(),
      deriveKey: jest.fn(),
      encrypt: jest.fn(),
      decrypt: jest.fn(),
    },
    getRandomValues: (arr) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256);
      }
      return arr;
    },
  };
}

