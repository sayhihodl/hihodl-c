// src/lib/lock.ts
// Utilidades básicas de “lock” (DESARROLLO). No uses este almacenamiento de PIN en producción.
// Si quieres endurecerlo: usa expo-crypto + salt aleatorio + scrypt/argon2.

import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';

const KEY_HAS_WALLET = 'hihodl_has_wallet';
const KEY_LOCK_ENABLED = 'hihodl_lock_enabled';
const KEY_PIN = 'hihodl_pin_dev'; // ⚠️ DEV SOLO

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
export async function isLockEnabled(): Promise<boolean> {
  return (await SecureStore.getItemAsync(KEY_LOCK_ENABLED)) === '1';
}

/** Set & verify PIN (DEV: se guarda plano; cambia esto en prod) */
export async function setPin(pin: string) {
  await SecureStore.setItemAsync(KEY_PIN, pin);
}
export async function verifyPin(pin: string): Promise<boolean> {
  const saved = await SecureStore.getItemAsync(KEY_PIN);
  return !!saved && saved === pin;
}

/** Intento de autenticación biométrica (Face ID/huella) */
export async function tryBiometricAuth(): Promise<boolean> {
  try {
    const hasHW = await LocalAuthentication.hasHardwareAsync();
    if (!hasHW) return false;

    const enrolled = await LocalAuthentication.isEnrolledAsync();
    if (!enrolled) return false;

    const res = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Unlock HIHODL',
      cancelLabel: 'Cancel',
      disableDeviceFallback: false,
      requireConfirmation: false,
    });
    return res.success === true;
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
  await SecureStore.deleteItemAsync(KEY_PIN);
  await SecureStore.deleteItemAsync(KEY_LOCK_ENABLED);
  await SecureStore.deleteItemAsync(KEY_HAS_WALLET);
}