/* src/lib/crypto.ts */
// Utils de cifrado para Expo con WebCrypto (subtle) + scrypt-js
import { scrypt } from "scrypt-js";

const enc = new TextEncoder();
// const dec = new TextDecoder(); // (no usado)

export type ScryptParams = { N: number; r: number; p: number };
export const DEFAULT_SCRYPT: ScryptParams = { N: 16384, r: 8, p: 1 };

/** Cast seguro para TS (ArrayBufferLike -> ArrayBuffer) */
const toBuf = (u8: Uint8Array): ArrayBuffer => u8.buffer as ArrayBuffer;

/** Deriva 32 bytes con scrypt */
export async function scryptKey(
  passphrase: string,
  saltP: Uint8Array,
  params: ScryptParams = DEFAULT_SCRYPT
): Promise<Uint8Array> {
  const pwd = enc.encode(passphrase);
  const dk = await scrypt(pwd, saltP, params.N, params.r, params.p, 32); // ← dkLen
  return new Uint8Array(dk);
}

/** HKDF -> AES-GCM 256 */
export async function hkdfAesKey(
  ikm: Uint8Array,
  pepperR: Uint8Array,
  info = "hihodl/v1"
): Promise<CryptoKey> {
  const baseKey = await crypto.subtle.importKey("raw", toBuf(ikm), "HKDF", false, ["deriveKey"]);
  const key = await crypto.subtle.deriveKey(
    {
      name: "HKDF",
      hash: "SHA-256",
      salt: toBuf(pepperR),
      info: enc.encode(info), // BufferSource (ok)
    } as HkdfParams,
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
  return key;
}

export async function aesGcmEncrypt(
  key: CryptoKey,
  plaintext: Uint8Array
): Promise<{ iv: Uint8Array; ct: Uint8Array }> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = new Uint8Array(
    await crypto.subtle.encrypt({ name: "AES-GCM", iv: toBuf(iv) }, key, toBuf(plaintext))
  );
  return { iv, ct };
}

export async function aesGcmDecrypt(
  key: CryptoKey,
  iv: Uint8Array,
  ct: Uint8Array
): Promise<Uint8Array> {
  const pt = new Uint8Array(
    await crypto.subtle.decrypt({ name: "AES-GCM", iv: toBuf(iv) }, key, toBuf(ct))
  );
  return pt;
}

/* opcional: helpers base64 (requiere Buffer polyfill en RN) */
// export const b64e = (u8: Uint8Array) => Buffer.from(u8).toString("base64");
// export const b64d = (b64: string) => new Uint8Array(Buffer.from(b64, "base64"));