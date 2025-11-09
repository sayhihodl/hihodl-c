// src/lib/vault.ts
// Vault system for encrypting/decrypting mnemonics using Supabase
import * as SecureStore from "expo-secure-store";
import { supabase } from "./supabase";
import { aesGcmDecrypt, aesGcmEncrypt, DEFAULT_SCRYPT, hkdfAesKey, scryptKey } from "./crypto";

const V = 1;
const K_TEMP_FLAG   = "hihodl::pass_is_temp_v1";
const K_TEMP_SECRET = "hihodl::pass_temp_secret_v1";

export async function getOrCreateTempPassphrase(): Promise<string> {
  const existing = await SecureStore.getItemAsync(K_TEMP_SECRET);
  if (existing) return existing;
  // 32 bytes aleatorios en base64-url
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  const pass  = Buffer.from(bytes).toString("base64url");
  await SecureStore.setItemAsync(K_TEMP_SECRET, pass, { requireAuthentication: false });
  await SecureStore.setItemAsync(K_TEMP_FLAG, "1");
  return pass;
}

export async function isUsingTempPassphrase(): Promise<boolean> {
  return (await SecureStore.getItemAsync(K_TEMP_FLAG)) === "1";
}

export async function markPassphraseAsUserSet() {
  await SecureStore.deleteItemAsync(K_TEMP_FLAG);
}

// === flujo vault existente (lo adaptamos mínimamente) ===

export type CipherBlob = {
  ctB64: string;
  ivB64: string;
  saltPB64: string;
  params: { N: number; r: number; p: number };
  v: number;
};

const b64e = (u8: Uint8Array) => Buffer.from(u8).toString("base64");
const b64d = (b64: string) => new Uint8Array(Buffer.from(b64, "base64"));

/**
 * Fetch pepper from backend
 * The pepper is a server-side secret that adds extra security
 * If backend is not available, generates a mock pepper (not recommended for production)
 */
async function fetchPepperR(): Promise<Uint8Array> {
  const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://api.hihodl.xyz';
  
  try {
    // Import useAuthStore dynamically to avoid circular dependency
    const { useAuthStore } = await import('@/store/auth');
    const { session } = useAuthStore.getState();
    if (!session) {
      throw new Error('Not authenticated');
    }

    const response = await fetch(`${API_BASE_URL}/api/security/pepper`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    if (response.ok) {
      const data = await response.json();
      // Pepper comes as base64 string
      const pepperBytes = Buffer.from(data.pepper, 'base64');
      return new Uint8Array(pepperBytes);
    }
  } catch (error) {
    const { logger } = await import('@/utils/logger');
    logger.error('Failed to fetch pepper from backend', error);
    
    // In production, fail hard - don't use mock
    if (process.env.NODE_ENV === 'production' || !__DEV__) {
      throw new Error(
        'Failed to fetch pepper from backend. This is required for security. ' +
        'Please ensure the backend endpoint /api/security/pepper is available.'
      );
    }
    
    // Only allow mock in development with explicit warning
    logger.warn(
      '⚠️ SECURITY WARNING: Using mock pepper. This should NEVER happen in production!'
    );
    const mock = crypto.getRandomValues(new Uint8Array(32));
    return mock;
  }
}

/** Crea (si no existe) o desbloquea la vault con la passphrase dada. */
export async function createOrUnlockVault(
  uid: string,
  passphrase: string,
  mnemonicFactory?: () => string // opcional para test: puedes pasar tu DEMO_SEED
): Promise<{ mnemonic: string; created: boolean }> {
  // Check if vault exists in Supabase
  const { data: existing, error: fetchError } = await supabase
    .from('vaults')
    .select('*')
    .eq('user_id', uid)
    .eq('name', 'default')
    .single();

  const R = await fetchPepperR();

  if (!existing || fetchError) {
    // Create new vault
    const saltP = crypto.getRandomValues(new Uint8Array(16));
    const P = await scryptKey(passphrase, saltP, DEFAULT_SCRYPT);
    const K = await hkdfAesKey(P, R, "hihodl/v1");

    const mnemonic = mnemonicFactory ? mnemonicFactory() : "auto demo seed only for dev";
    const data = new TextEncoder().encode(mnemonic);
    const { iv, ct } = await aesGcmEncrypt(K, data);

    const blob: CipherBlob = {
      v: V,
      params: DEFAULT_SCRYPT,
      ctB64: b64e(ct),
      ivB64: b64e(iv),
      saltPB64: b64e(saltP),
    };

    // Insert into Supabase
    const { error: insertError } = await supabase
      .from('vaults')
      .insert({
        user_id: uid,
        name: 'default',
        cipher_blob: blob,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

    if (insertError) {
      throw new Error(`Failed to create vault: ${insertError.message}`);
    }

    return { mnemonic, created: true };
  }

  // Unlock existing vault
  const blob = existing.cipher_blob as CipherBlob;
  const P2 = await scryptKey(passphrase, b64d(blob.saltPB64), blob.params);
  const K2 = await hkdfAesKey(P2, R, "hihodl/v1");
  const mnemonic = new TextDecoder().decode(
    await aesGcmDecrypt(K2, b64d(blob.ivB64), b64d(blob.ctB64))
  );
  return { mnemonic, created: false };
}

/** Cambia passphrase manteniendo la misma seed (ya lo estabas usando). */
export async function changePassphrase(uid: string, oldPass: string, newPass: string) {
  // Fetch existing vault
  const { data: existing, error: fetchError } = await supabase
    .from('vaults')
    .select('*')
    .eq('user_id', uid)
    .eq('name', 'default')
    .single();

  if (!existing || fetchError) {
    throw new Error("Vault not found");
  }

  const R = await fetchPepperR();
  const blob = existing.cipher_blob as CipherBlob;

  // Decrypt with old passphrase
  const Pold = await scryptKey(oldPass, b64d(blob.saltPB64), blob.params);
  const Kold = await hkdfAesKey(Pold, R, "hihodl/v1");
  const mnemonic = new TextDecoder().decode(
    await aesGcmDecrypt(Kold, b64d(blob.ivB64), b64d(blob.ctB64))
  );

  // Encrypt with new passphrase
  const saltP = crypto.getRandomValues(new Uint8Array(16));
  const Pnew = await scryptKey(newPass, saltP, DEFAULT_SCRYPT);
  const Knew = await hkdfAesKey(Pnew, R, "hihodl/v1");
  const { iv, ct } = await aesGcmEncrypt(Knew, new TextEncoder().encode(mnemonic));

  const newBlob: CipherBlob = {
    v: V,
    params: DEFAULT_SCRYPT,
    ctB64: b64e(ct),
    ivB64: b64e(iv),
    saltPB64: b64e(saltP),
  };

  // Update in Supabase
  const { error: updateError } = await supabase
    .from('vaults')
    .update({
      cipher_blob: newBlob,
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', uid)
    .eq('name', 'default');

  if (updateError) {
    throw new Error(`Failed to update vault: ${updateError.message}`);
  }

  // marca que ya no usamos pass temporal
  await markPassphraseAsUserSet();
}