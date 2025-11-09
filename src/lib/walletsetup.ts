// src/lib/walletSetup.ts
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Claves de almacenamiento
export const META_KEY = 'HIHODL_WALLETS_META';
export const PRINCIPAL_KEY = 'HIHODL_PRINCIPAL_LABEL';

// Seeds en SecureStore
const SEED_KEYS = {
  daily: 'SEED_DAILY',
  savings: 'SEED_SAVINGS',
  social: 'SEED_SOCIAL',
} as const;

type WalletMeta = {
  label: string;           // "Daily" | "Savings" | "Social" | custom
  type: 'daily' | 'savings' | 'social';
  createdAt: number;
};

const WORDS = [
  'galaxy','forest','sun','ocean','river','stone','shadow','ember','frost','cloud',
  'delta','harbor','cable','citrus','vortex','maple','cedar','drift','violet','azure',
  'orbit','signal','lambda','matrix','nova','quartz','pixel','neon','ember','copper',
];

// Mock de 12 palabras (para prototipo)
function generateMnemonicMock() {
  const pick = () => WORDS[Math.floor(Math.random() * WORDS.length)];
  return Array.from({ length: 12 }, pick).join(' ');
}

export async function createThreeWallets() {
  // Genera y guarda 3 seeds
  const daily   = generateMnemonicMock();
  const savings = generateMnemonicMock();
  const social  = generateMnemonicMock();

  await SecureStore.setItemAsync(SEED_KEYS.daily, daily);
  await SecureStore.setItemAsync(SEED_KEYS.savings, savings);
  await SecureStore.setItemAsync(SEED_KEYS.social, social);

  // Verificar si hay una preferencia guardada del onboarding
  const principalPreference = await AsyncStorage.getItem(PRINCIPAL_KEY);
  const customName = await AsyncStorage.getItem('HIHODL_CUSTOM_PRINCIPAL_NAME');
  
  // Determinar el label para la cuenta principal
  let principalLabel = 'Daily';
  if (principalPreference === 'Other' && customName) {
    principalLabel = customName;
  } else if (principalPreference && principalPreference !== 'Other') {
    principalLabel = principalPreference;
  }

  const meta: WalletMeta[] = [
    { label: principalLabel, type: 'daily',   createdAt: Date.now() },
    { label: 'Savings',      type: 'savings', createdAt: Date.now() },
    { label: 'Social',        type: 'social',  createdAt: Date.now() },
  ];

  // Reordenar según la preferencia del usuario
  if (principalPreference === 'Savings') {
    // Mover Savings al principio
    const [savingsWallet] = meta.splice(1, 1);
    meta.unshift(savingsWallet);
  } else if (principalPreference === 'Social') {
    // Mover Social al principio
    const [socialWallet] = meta.splice(2, 1);
    meta.unshift(socialWallet);
  }

  await AsyncStorage.setItem(META_KEY, JSON.stringify(meta));
  await AsyncStorage.setItem(PRINCIPAL_KEY, meta[0].label);
  
  return meta;
}

// Renombra “Daily” si el usuario escribió un “Other”
export async function renameDailyLabel(newLabel: string) {
  const raw = await AsyncStorage.getItem(META_KEY);
  if (!raw) return;
  const meta: WalletMeta[] = JSON.parse(raw);
  const idx = meta.findIndex(m => m.type === 'daily');
  if (idx >= 0) {
    meta[idx] = { ...meta[idx], label: newLabel.trim() };
    await AsyncStorage.setItem(META_KEY, JSON.stringify(meta));
  }
}

// Reordena para marcar la principal (la mueve al índice 0)
export async function setPrincipalByLabel(label: string) {
  const raw = await AsyncStorage.getItem(META_KEY);
  if (!raw) return;
  const meta: WalletMeta[] = JSON.parse(raw);
  const idx = meta.findIndex(m => m.label === label);
  if (idx > -1) {
    const [chosen] = meta.splice(idx, 1);
    meta.unshift(chosen);
    await AsyncStorage.setItem(META_KEY, JSON.stringify(meta));
    await AsyncStorage.setItem(PRINCIPAL_KEY, chosen.label);
  }
}

// Helpers para leer luego
export async function getWalletsMeta(): Promise<WalletMeta[] | null> {
  const raw = await AsyncStorage.getItem(META_KEY);
  return raw ? JSON.parse(raw) : null;
}
export async function getPrincipalLabel(): Promise<string | null> {
  return AsyncStorage.getItem(PRINCIPAL_KEY);
}