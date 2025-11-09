// src/lib/lock.ts
// Lock utilities with secure PIN hashing
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import { setPinSecure, verifyPinSecure, hasPin as hasPinSecure, deletePin as deletePinSecure } from './pin';

const KEY_HAS_WALLET = 'hihodl_has_wallet';
const KEY_LOCK_ENABLED = 'hihodl_lock_enabled';
const KEY_PIN_LEGACY = 'hihodl_pin_dev'; // Legacy - for migration only

/** Marca que el usuario ya tiene wallet creada/importada */
export async function markHasWallet() {
  await SecureStore.setItemAsync(KEY_HAS_WALLET, '1');
}

export async function hasWallet(): Promise<boolean> {
  return (await SecureStore.getItemAsync(KEY_HAS_WALLET)) === '1';
}

/** Activa/desactiva el lock */
export async function enableLock() {
  await SecureStore.setItemAsync(KEY_LOCK_ENABLED, '1');
}
export async function disableLock() {
  await SecureStore.setItemAsync(KEY_LOCK_ENABLED, '0');
}
/** Verifica si el lock está realmente configurado y habilitado */
export async function isLockEnabled(): Promise<boolean> {
  const enabled = (await SecureStore.getItemAsync(KEY_LOCK_ENABLED)) === '1';
  if (!enabled) return false;
  
  // Verificar que realmente haya PIN o biometría configurado
  const hasPin = await hasPinSecure();
  if (hasPin) return true;
  
  // Verificar si hay biometría disponible
  try {
    const hasHW = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    if (hasHW && enrolled) return true;
  } catch {
    // Ignore
  }
  
  // Si el lock está marcado como habilitado pero no hay credenciales, deshabilitarlo
  await disableLock();
  return false;
}

/** Set PIN with secure hashing (PRODUCTION) */
export async function setPin(pin: string) {
  // Try to migrate from legacy if exists
  try {
    const legacyPin = await SecureStore.getItemAsync(KEY_PIN_LEGACY);
    if (legacyPin) {
      // Migrate legacy PIN first
      await setPinSecure(legacyPin);
      await SecureStore.deleteItemAsync(KEY_PIN_LEGACY);
    }
  } catch {
    // No legacy PIN, continue
  }
  
  await setPinSecure(pin);
}

/** Verify PIN with secure hashing (PRODUCTION) */
export async function verifyPin(pin: string): Promise<boolean> {
  // Try secure PIN first
  const hasSecurePin = await hasPinSecure();
  
  if (hasSecurePin) {
    return await verifyPinSecure(pin);
  }
  
  // Fallback to legacy (for migration)
  try {
    const legacyPin = await SecureStore.getItemAsync(KEY_PIN_LEGACY);
    if (legacyPin && legacyPin === pin) {
      // Migrate to secure format
      await setPinSecure(pin);
      await SecureStore.deleteItemAsync(KEY_PIN_LEGACY);
      return true;
    }
  } catch {
    // Ignore
  }
  
  return false;
}

/** Intento de autenticación biométrica (Face ID/huella) */
export async function tryBiometricAuth(promptMessage: string = 'Unlock HIHODL'): Promise<boolean> {
  try {
    const hasHW = await LocalAuthentication.hasHardwareAsync();
    if (!hasHW) return false;

    const enrolled = await LocalAuthentication.isEnrolledAsync();
    if (!enrolled) return false;

    const res = await LocalAuthentication.authenticateAsync({
      promptMessage,
      cancelLabel: 'Cancel',
      disableDeviceFallback: false,
      requireConfirmation: false,
    });
    return res.success === true;
  } catch {
    return false;
  }
}

/** Always-on sensitive action guard: Face/Touch ID first, fallback is caller-defined */
export async function requireSensitiveAuth(promptMessage: string = 'Authorize transaction'): Promise<boolean> {
  // For now we rely on biometrics; PIN fallback should be handled by caller screen if needed
  const ok = await tryBiromaticAuthSafe(promptMessage);
  return ok;
}

async function tryBiromaticAuthSafe(promptMessage: string): Promise<boolean> {
  try {
    return await tryBiometricAuth(promptMessage);
  } catch {
    return false;
  }
}

/** Helper para preparar un entorno de demo rápido tras onboarding */
export async function quickEnableDevLock(pin = '1234') {
  await markHasWallet();
  await setPin(pin);
  await enableLock();
}

/** Limpia todo lo del lock (útil en pruebas) */
export async function clearLockStateDev() {
  await deletePinSecure();
  await SecureStore.deleteItemAsync(KEY_LOCK_ENABLED);
  await SecureStore.deleteItemAsync(KEY_HAS_WALLET);
}