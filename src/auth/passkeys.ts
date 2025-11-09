// src/auth/passkeys.ts
// Passkeys (WebAuthn/FIDO2) authentication
import { Platform } from 'react-native';
import {
  startRegistration,
  startAuthentication,
  browserSupportsWebAuthn,
  platformAuthenticatorIsAvailable,
} from '@simplewebauthn/browser';
import type {
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
  RegistrationResponseJSON,
  AuthenticationResponseJSON,
} from '@simplewebauthn/browser';
import { useAuthStore } from '@/store/auth';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://api.hihodl.xyz';

export interface PasskeyRegistrationOptions {
  email?: string;
  userId?: string;
}

export interface PasskeyAuthOptions {
  email: string;
}

/**
 * Check if passkeys are supported on this platform
 */
export async function isPasskeySupported(): Promise<boolean> {
  if (Platform.OS === 'web') {
    return browserSupportsWebAuthn() && (await platformAuthenticatorIsAvailable());
  }
  // On React Native, we'd need a native module
  // For now, return false for mobile
  // TODO: Implement native WebAuthn bridge for React Native
  return false;
}

/**
 * Begin passkey registration
 * Returns options for creating a new passkey
 */
export async function beginPasskeyRegistration(
  options: PasskeyRegistrationOptions
): Promise<{
  options: PublicKeyCredentialCreationOptionsJSON | null;
  error: Error | null;
}> {
  const { setLoading, setError } = useAuthStore.getState();
  setLoading(true);
  setError(null);

  try {
    if (!(await isPasskeySupported())) {
      throw new Error('Passkeys are not supported on this device');
    }

    const response = await fetch(`${API_BASE_URL}/api/passkeys/register/begin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to begin passkey registration');
    }

    const data = await response.json();
    return { options: data.publicKey, error: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    setError(message);
    return { options: null, error: new Error(message) };
  } finally {
    setLoading(false);
  }
}

/**
 * Complete passkey registration
 */
export async function completePasskeyRegistration(
  credential: RegistrationResponseJSON
): Promise<{ error: Error | null }> {
  const { setLoading, setError } = useAuthStore.getState();
  setLoading(true);
  setError(null);

  try {
    const response = await fetch(`${API_BASE_URL}/api/passkeys/register/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credential }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to complete passkey registration');
    }

    const data = await response.json();
    
    // Update auth state if session is returned
    if (data.session) {
      const { setUser } = useAuthStore.getState();
      setUser(data.user, data.session, 'passkey');
    }

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
 * Register a new passkey for the current user
 */
export async function registerPasskey(
  options: PasskeyRegistrationOptions = {}
): Promise<{ error: Error | null }> {
  try {
    // Begin registration
    const { options: creationOptions, error: beginError } =
      await beginPasskeyRegistration(options);

    if (beginError || !creationOptions) {
      return { error: beginError || new Error('Failed to get registration options') };
    }

    // Create passkey using WebAuthn API
    const credential = await startRegistration(creationOptions);

    // Complete registration
    return await completePasskeyRegistration(credential);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { error: new Error(message) };
  }
}

/**
 * Begin passkey authentication
 */
export async function beginPasskeyAuthentication(
  options: PasskeyAuthOptions
): Promise<{
  options: PublicKeyCredentialRequestOptionsJSON | null;
  error: Error | null;
}> {
  const { setLoading, setError } = useAuthStore.getState();
  setLoading(true);
  setError(null);

  try {
    if (!(await isPasskeySupported())) {
      throw new Error('Passkeys are not supported on this device');
    }

    const response = await fetch(`${API_BASE_URL}/api/passkeys/login/begin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to begin passkey authentication');
    }

    const data = await response.json();
    return { options: data.publicKey, error: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    setError(message);
    return { options: null, error: new Error(message) };
  } finally {
    setLoading(false);
  }
}

/**
 * Complete passkey authentication
 */
export async function completePasskeyAuthentication(
  assertion: AuthenticationResponseJSON
): Promise<{ error: Error | null }> {
  const { setLoading, setError } = useAuthStore.getState();
  setLoading(true);
  setError(null);

  try {
    const response = await fetch(`${API_BASE_URL}/api/passkeys/login/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assertion }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to complete passkey authentication');
    }

    const data = await response.json();
    
    // Update auth state
    if (data.session) {
      const { setUser } = useAuthStore.getState();
      setUser(data.user, data.session, 'passkey');
    }

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
 * Authenticate with passkey
 */
export async function signInWithPasskey(
  email: string
): Promise<{ error: Error | null }> {
  try {
    // Begin authentication
    const { options: authOptions, error: beginError } =
      await beginPasskeyAuthentication({ email });

    if (beginError || !authOptions) {
      return { error: beginError || new Error('Failed to get authentication options') };
    }

    // Get assertion using WebAuthn API
    const assertion = await startAuthentication(authOptions);

    // Complete authentication
    return await completePasskeyAuthentication(assertion);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { error: new Error(message) };
  }
}

/**
 * List user's passkeys
 */
export async function listPasskeys(): Promise<{
  passkeys: Array<{ id: string; name: string; createdAt: string }>;
  error: Error | null;
}> {
  try {
    const { session } = useAuthStore.getState();
    if (!session) {
      return { passkeys: [], error: new Error('Not authenticated') };
    }

    const response = await fetch(`${API_BASE_URL}/api/passkeys/list`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to list passkeys');
    }

    const data = await response.json();
    return { passkeys: data.passkeys || [], error: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { passkeys: [], error: new Error(message) };
  }
}

/**
 * Delete a passkey
 */
export async function deletePasskey(passkeyId: string): Promise<{ error: Error | null }> {
  try {
    const { session } = useAuthStore.getState();
    if (!session) {
      return { error: new Error('Not authenticated') };
    }

    const response = await fetch(`${API_BASE_URL}/api/passkeys/${passkeyId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete passkey');
    }

    return { error: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return { error: new Error(message) };
  }
}

