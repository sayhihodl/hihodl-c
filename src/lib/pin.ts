/**
 * PIN security utilities
 * Uses scrypt for secure hashing (production-ready)
 */
import { scryptKey, DEFAULT_SCRYPT } from '@/lib/crypto';
import * as SecureStore from 'expo-secure-store';

const KEY_PIN_SALT = 'hihodl_pin_salt';
const KEY_PIN_HASH = 'hihodl_pin_hash';

/**
 * Set PIN with secure hashing
 * @param pin - PIN to set (4-6 digits recommended)
 */
export async function setPinSecure(pin: string): Promise<void> {
  if (!pin || pin.length < 4) {
    throw new Error('PIN must be at least 4 digits');
  }

  // Generate unique salt for this PIN
  const salt = crypto.getRandomValues(new Uint8Array(16));
  
  // Hash PIN with scrypt
  const hash = await scryptKey(pin, salt, DEFAULT_SCRYPT);
  
  // Store salt and hash separately
  const saltB64 = Buffer.from(salt).toString('base64');
  const hashB64 = Buffer.from(hash).toString('base64');
  
  await SecureStore.setItemAsync(KEY_PIN_SALT, saltB64, {
    requireAuthentication: true, // Require biometric to access salt
  });
  
  await SecureStore.setItemAsync(KEY_PIN_HASH, hashB64, {
    requireAuthentication: true, // Require biometric to access hash
  });
}

/**
 * Verify PIN
 * @param pin - PIN to verify
 * @returns true if PIN matches, false otherwise
 */
export async function verifyPinSecure(pin: string): Promise<boolean> {
  try {
    const saltB64 = await SecureStore.getItemAsync(KEY_PIN_SALT, {
      requireAuthentication: true,
    });
    const hashB64 = await SecureStore.getItemAsync(KEY_PIN_HASH, {
      requireAuthentication: true,
    });

    if (!saltB64 || !hashB64) {
      return false;
    }

    const salt = new Uint8Array(Buffer.from(saltB64, 'base64'));
    const storedHash = new Uint8Array(Buffer.from(hashB64, 'base64'));

    // Hash the provided PIN with stored salt
    const computedHash = await scryptKey(pin, salt, DEFAULT_SCRYPT);

    // Constant-time comparison to prevent timing attacks
    if (computedHash.length !== storedHash.length) {
      return false;
    }

    let matches = true;
    for (let i = 0; i < computedHash.length; i++) {
      matches = matches && computedHash[i] === storedHash[i];
    }

    return matches;
  } catch (error) {
    // If auth fails or other error, return false
    return false;
  }
}

/**
 * Check if PIN is set
 */
export async function hasPin(): Promise<boolean> {
  try {
    const hash = await SecureStore.getItemAsync(KEY_PIN_HASH, {
      requireAuthentication: false, // Just check existence
    });
    return !!hash;
  } catch {
    return false;
  }
}

/**
 * Delete PIN (for reset/migration)
 */
export async function deletePin(): Promise<void> {
  await SecureStore.deleteItemAsync(KEY_PIN_SALT);
  await SecureStore.deleteItemAsync(KEY_PIN_HASH);
}

/**
 * Migrate old plaintext PIN to secure hash
 * @param oldPin - Old plaintext PIN from legacy storage
 */
export async function migratePinFromLegacy(oldPin: string): Promise<void> {
  // Check if secure PIN already exists
  if (await hasPin()) {
    return; // Already migrated
  }

  // Migrate old PIN to secure format
  await setPinSecure(oldPin);

  // Delete old plaintext PIN (if it exists)
  try {
    await SecureStore.deleteItemAsync('hihodl_pin_dev');
  } catch {
    // Ignore if doesn't exist
  }
}

