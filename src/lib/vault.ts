// src/lib/vault.ts
import * as SecureStore from "expo-secure-store";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";
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

async function fetchPepperR(): Promise<Uint8Array> {
  // ← cuando integres backend: httpsCallable('getPepper'); aquí usa un mock si hace falta
  const mock = crypto.getRandomValues(new Uint8Array(32));
  return mock;
}

/** Crea (si no existe) o desbloquea la vault con la passphrase dada. */
export async function createOrUnlockVault(
  uid: string,
  passphrase: string,
  mnemonicFactory?: () => string // opcional para test: puedes pasar tu DEMO_SEED
): Promise<{ mnemonic: string; created: boolean }> {
  const db = getFirestore();
  const vref = doc(db, "users", uid, "vault", "default");
  const snap = await getDoc(vref);

  const R = await fetchPepperR();

  if (!snap.exists()) {
    // crear
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
    await setDoc(vref, blob, { merge: true });
    return { mnemonic, created: true };
  }

  // desbloquear
  const blob = snap.data() as CipherBlob;
  const P2 = await scryptKey(passphrase, b64d(blob.saltPB64), blob.params);
  const K2 = await hkdfAesKey(P2, R, "hihodl/v1");
  const mnemonic = new TextDecoder().decode(
    await aesGcmDecrypt(K2, b64d(blob.ivB64), b64d(blob.ctB64))
  );
  return { mnemonic, created: false };
}

/** Cambia passphrase manteniendo la misma seed (ya lo estabas usando). */
export async function changePassphrase(uid: string, oldPass: string, newPass: string) {
  const db = getFirestore();
  const vref = doc(db, "users", uid, "vault", "default");
  const snap = await getDoc(vref);
  if (!snap.exists()) throw new Error("Vault not found");

  const R = await fetchPepperR();
  const blob = snap.data() as CipherBlob;

  const Pold = await scryptKey(oldPass, b64d(blob.saltPB64), blob.params);
  const Kold = await hkdfAesKey(Pold, R, "hihodl/v1");
  const mnemonic = new TextDecoder().decode(
    await aesGcmDecrypt(Kold, b64d(blob.ivB64), b64d(blob.ctB64))
  );

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
  await setDoc(vref, newBlob, { merge: true });

  // marca que ya no usamos pass temporal
  await markPassphraseAsUserSet();
}