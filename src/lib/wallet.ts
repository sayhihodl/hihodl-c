// src/lib/wallet.ts
import * as Crypto from "expo-crypto";
import * as SecureStore from "expo-secure-store";
import * as bip39 from "bip39";

export type WalletKind = "daily" | "savings" | "social";

export type SeedBundle = {
  kind: WalletKind;
  mnemonic: string; // 12 palabras por defecto
};

export type ThreeSeeds = [SeedBundle, SeedBundle, SeedBundle];

const SECURE_KEY = "hihodl::seedbundle::v1";

// helper: Uint8Array -> hex (sin Buffer)
const toHex = (u8: Uint8Array): string =>
  Array.from(u8).map((b) => b.toString(16).padStart(2, "0")).join("");

/** Genera N bytes de entropía y devuelve un mnemonic BIP39 (12 o 24 palabras). */
export async function generateMnemonic(words: 12 | 24 = 12): Promise<string> {
  const entropyBytes = words === 12 ? 16 : 32; // 128 o 256 bits
  const bytes = await Crypto.getRandomBytesAsync(entropyBytes);
  const entropyHex = toHex(bytes);
  return bip39.entropyToMnemonic(entropyHex);
}

/** Genera 3 mnemonics (Daily, Savings, Social). */
export async function generateThreeMnemonics(): Promise<ThreeSeeds> {
  const [m1, m2, m3] = await Promise.all([
    generateMnemonic(12),
    generateMnemonic(12),
    generateMnemonic(12),
  ]);
  return [
    { kind: "daily", mnemonic: m1 },
    { kind: "savings", mnemonic: m2 },
    { kind: "social", mnemonic: m3 },
  ];
}

/** Guarda temporalmente en SecureStore (cifrado del SO). */
export async function saveSeedsSecure(b: ThreeSeeds): Promise<void> {
  await SecureStore.setItemAsync(SECURE_KEY, JSON.stringify(b));
}

/** Lee si existen (devuelve null si no hay). */
export async function loadSeedsSecure(): Promise<ThreeSeeds | null> {
  const raw = await SecureStore.getItemAsync(SECURE_KEY);
  return raw ? (JSON.parse(raw) as ThreeSeeds) : null;
}

/** Borra las seeds de SecureStore (por seguridad tras onboarding). */
export async function clearSeedsSecure(): Promise<void> {
  await SecureStore.deleteItemAsync(SECURE_KEY);
}