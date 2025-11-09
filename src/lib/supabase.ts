// src/lib/supabase.ts
// Supabase client configuration for React Native and Web
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Supabase configuration from environment variables
const supabaseUrl = (process.env.EXPO_PUBLIC_SUPABASE_URL ?? '').trim();
const supabaseAnonKey = (process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '').trim();

// Use dummy values if not configured (prevents app crash, but auth won't work)
const safeUrl = supabaseUrl || 'https://placeholder.supabase.co';
const safeKey = supabaseAnonKey || 'placeholder-key';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '⚠️ Supabase URL or Anon Key missing. Please set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY'
  );
  console.warn(
    '⚠️ Using placeholder values. Authentication will not work until configured.'
  );
}

/**
 * Custom storage adapter for React Native using SecureStore
 * This ensures tokens are stored securely on the device
 */
const secureStoreAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      console.warn('SecureStore getItem error:', error);
      return null;
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      await SecureStore.setItemAsync(key, value, {
        requireAuthentication: false, // Can be enabled for extra security
        keychainAccessible: SecureStore.WHEN_UNLOCKED,
      });
    } catch (error) {
      console.warn('SecureStore setItem error:', error);
    }
  },
  removeItem: async (key: string): Promise<void> => {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch (error) {
      console.warn('SecureStore deleteItem error:', error);
    }
  },
};

/**
 * Supabase client instance
 * Uses secure storage adapter on React Native, localStorage on web
 * Note: If Supabase is not configured, this will use placeholder values
 * and auth operations will fail gracefully
 */
export const supabase: SupabaseClient = createClient(safeUrl, safeKey, {
  auth: {
    storage: Platform.OS === 'web' ? undefined : secureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === 'web',
  },
});

/**
 * Check if Supabase is properly configured
 */
export function isSupabaseConfigured(): boolean {
  return !!(supabaseUrl && supabaseAnonKey && supabaseUrl !== 'https://placeholder.supabase.co');
}

// Re-export types for convenience
export type { User, Session, AuthError } from '@supabase/supabase-js';

