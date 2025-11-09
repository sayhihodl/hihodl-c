// src/auth/oauth.ts
// OAuth authentication with Supabase (Google, Apple)
import { Platform, Linking } from 'react-native';
import * as AuthSession from 'expo-auth-session';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as WebBrowser from 'expo-web-browser';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/auth';
import { OAUTH } from '@/config/app';
import { makeRedirectUri } from 'expo-auth-session';

export type OAuthProvider = 'google' | 'apple';

/**
 * Sign in with Google OAuth using Supabase
 */
export async function signInWithGoogle(): Promise<{ error: Error | null }> {
  const { setLoading, setError } = useAuthStore.getState();
  setLoading(true);
  setError(null);

  try {
    // Get redirect URI
    // IMPORTANTE: No usar preferLocalhost en dispositivos físicos
    // preferLocalhost solo funciona en simulador/emulador
    const redirectTo = makeRedirectUri({
      scheme: 'hihodl',
      path: 'auth/callback',
      preferLocalhost: false, // Forzar deep link en lugar de localhost
    });

    // Start OAuth flow with Supabase
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });

    if (error) {
      setError(error.message);
      return { error };
    }

    // On mobile, we need to handle the redirect manually
    if (Platform.OS !== 'web' && data.url) {
      try {
        // Open URL in browser and wait for callback
        // NOTA: openAuthSessionAsync puede devolver 'cancel' si el usuario cierra la ventana
        // o si el deep link se abre correctamente (el navegador se cierra y la app se abre)
        // Por eso, no tratamos 'cancel' como error fatal - el deep link puede funcionar de todas formas
        const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
        
        // Si el usuario cancela explícitamente, no mostrar error (es normal)
        if (result.type === 'cancel') {
          // No establecer error - el usuario simplemente decidió no continuar
          // El listener de auth state change manejará si el login se completa
          console.log('User cancelled OAuth flow or browser closed');
          return { error: null }; // No es un error, solo el usuario canceló
        }
        
        // If we got a URL back, handle the callback
        if (result.type === 'success' && result.url) {
          await handleOAuthCallback(result.url);
        } else {
          // Si no hay URL pero tampoco es cancel, puede ser que el deep link funcione
          // El listener de auth state change manejará el callback
          console.log('OAuth flow completed, waiting for deep link callback');
        }
      } catch (browserError) {
        // Si openAuthSessionAsync falla, intentar con Linking como fallback
        console.warn('WebBrowser.openAuthSessionAsync failed, using Linking fallback:', browserError);
        try {
          await Linking.openURL(data.url);
          // No establecer error - el usuario puede completar el login en el navegador
          // El deep link abrirá la app cuando termine
          console.log('Opened browser for OAuth, waiting for deep link callback');
        } catch (linkingError) {
          setError('Failed to open browser for authentication');
          return { error: linkingError instanceof Error ? linkingError : new Error('Browser open failed') };
        }
      }
    }

    // Auth state change will update the store automatically
    return { error: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    setError(message);
    return { error: new Error(message) };
  } finally {
    setLoading(false);
  }
}

/**
 * Sign in with Apple using native SDK (iOS only)
 * Then exchange token with Supabase
 */
export async function signInWithApple(): Promise<{ error: Error | null }> {
  if (Platform.OS !== 'ios') {
    return { error: new Error('Apple Sign-In is only available on iOS') };
  }

  const { setLoading, setError } = useAuthStore.getState();
  setLoading(true);
  setError(null);

  try {
    // Check if Apple Auth is available
    const isAvailable = await AppleAuthentication.isAvailableAsync();
    if (!isAvailable) {
      throw new Error('Apple Sign-In is not available on this device');
    }

    // Get Apple credentials
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });

    if (!credential.identityToken) {
      throw new Error('Failed to get identity token from Apple');
    }

    // Exchange token with Supabase
    // Note: nonce is optional and may not be available in all cases
    const signInOptions: any = {
      provider: 'apple',
      token: credential.identityToken,
    };
    
    // Add nonce if available (it's not always present in the credential type)
    if ('nonce' in credential && credential.nonce) {
      signInOptions.nonce = credential.nonce;
    }
    
    const { data, error } = await supabase.auth.signInWithIdToken(signInOptions);

    if (error) {
      setError(error.message);
      return { error };
    }

    // Auth state change will update the store automatically
    const { setUser } = useAuthStore.getState();
    setUser(data.user, data.session, 'apple');

    return { error: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    setError(message);
    return { error: new Error(message) };
  } finally {
    setLoading(false);
  }
}

/**
 * Handle OAuth callback (for deep linking)
 */
export async function handleOAuthCallback(url: string): Promise<void> {
  try {
    // Extract code from URL
    const urlObj = new URL(url);
    const code = urlObj.searchParams.get('code');

    if (!code) {
      throw new Error('No authorization code found in callback URL');
    }

    // Exchange code for session
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      throw error;
    }

    // Auth state change will update the store automatically
    const { setUser } = useAuthStore.getState();
    setUser(data.user, data.session, 'google');
  } catch (error) {
    const { setError } = useAuthStore.getState();
    setError(error instanceof Error ? error.message : 'Failed to handle OAuth callback');
  }
}

