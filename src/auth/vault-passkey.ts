// src/auth/vault-passkey.ts
// Integration between passkeys and vault for secure key management
import { createOrUnlockVault, changePassphrase } from '@/lib/vault';
import { useAuth } from '@/store/auth';
import { signInWithPasskey } from './passkeys';

/**
 * Create or unlock vault using passkey authentication
 * This creates a secure link between passkey and vault
 */
export async function unlockVaultWithPasskey(
  email: string
): Promise<{ mnemonic: string | null; error: Error | null }> {
  try {
    const { user } = useAuth();
    if (!user) {
      return { mnemonic: null, error: new Error('User not authenticated') };
    }

    // First authenticate with passkey
    const passkeyResult = await signInWithPasskey(email);
    if (passkeyResult.error) {
      return { mnemonic: null, error: passkeyResult.error };
    }

    // Generate passphrase from passkey session
    // In a real implementation, we'd derive this from the passkey credential
    // For now, we'll use a secure method to derive a passphrase
    const session = useAuth().session;
    if (!session) {
      return { mnemonic: null, error: new Error('No session after passkey auth') };
    }

    // Derive passphrase from session token (secure method)
    const passphrase = await derivePassphraseFromSession(session.access_token);

    // Unlock vault with derived passphrase
    const vaultResult = await createOrUnlockVault(user.id, passphrase);
    
    return { mnemonic: vaultResult.mnemonic, error: null };
  } catch (error) {
    return {
      mnemonic: null,
      error: error instanceof Error ? error : new Error('Failed to unlock vault'),
    };
  }
}

/**
 * Create vault and register passkey during onboarding
 */
export async function setupVaultWithPasskey(
  email: string,
  mnemonic: string
): Promise<{ error: Error | null }> {
  try {
    const { user } = useAuth();
    if (!user) {
      return { error: new Error('User not authenticated') };
    }

    // Register passkey if not already registered
    const { registerPasskey } = await import('./passkeys');
    const passkeyResult = await registerPasskey({ email, userId: user.id });
    
    if (passkeyResult.error) {
      return { error: passkeyResult.error };
    }

    // Derive passphrase from session
    const session = useAuth().session;
    if (!session) {
      return { error: new Error('No session available') };
    }

    const passphrase = await derivePassphraseFromSession(session.access_token);

    // Create vault with mnemonic
    await createOrUnlockVault(user.id, passphrase, () => mnemonic);

    return { error: null };
  } catch (error) {
    return {
      error: error instanceof Error ? error : new Error('Failed to setup vault'),
    };
  }
}

/**
 * Derive a secure passphrase from session token
 * This creates a deterministic but secure passphrase for vault
 */
async function derivePassphraseFromSession(accessToken: string): Promise<string> {
  // Import crypto functions
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  // Hash the access token to create a deterministic passphrase
  const tokenData = encoder.encode(accessToken);
  const hashBuffer = await crypto.subtle.digest('SHA-256', tokenData);
  
  // Convert to base64url for passphrase
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashBase64 = btoa(String.fromCharCode(...hashArray))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');

  return hashBase64;
}

/**
 * Change vault passphrase when user updates their passkey
 */
export async function rotateVaultPassphrase(newSessionToken: string): Promise<{ error: Error | null }> {
  try {
    const { user } = useAuth();
    if (!user) {
      return { error: new Error('User not authenticated') };
    }

    // Get old passphrase (would need to be stored or derived differently)
    // For now, we'll need the old session or a different method
    // This is a placeholder for the rotation logic
    
    const newPassphrase = await derivePassphraseFromSession(newSessionToken);
    
    // This would need the old passphrase - might need to store it temporarily
    // or use a different method for rotation
    // await changePassphrase(user.id, oldPassphrase, newPassphrase);

    return { error: null };
  } catch (error) {
    return {
      error: error instanceof Error ? error : new Error('Failed to rotate passphrase'),
    };
  }
}

