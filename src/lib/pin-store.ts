// src/lib/pin-store.ts
import * as SecureStore from 'expo-secure-store';

const PIN_KEY = 'pin_v1'; // ✅ key válida (no cambia nunca)

export async function savePin(pin: string) {
  // validamos que sea solo números antes de guardar
  if (!/^\d+$/.test(pin)) {
    throw new Error('El PIN solo puede contener números');
  }
  await SecureStore.setItemAsync(PIN_KEY, pin);
}

export async function loadPin() {
  return SecureStore.getItemAsync(PIN_KEY);
}