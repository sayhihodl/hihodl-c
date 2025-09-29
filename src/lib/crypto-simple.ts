// src/lib/crypto-simple.ts
// Cifrado temporal en cliente (sin backend, ni Drive).
// ⚠️ Para producción cambiaremos a scrypt + HKDF + AES-GCM.

import { Buffer } from "buffer";

// En RN necesitas: polyfill de Buffer
if (typeof global.Buffer === "undefined") {
  // @ts-ignore
  global.Buffer = Buffer;
}

// Cifra semilla con una contraseña (inseguro, solo demo/dev)
export function encryptSeed(seed: string, pass: string): string {
  const data = `${pass}::${seed}`;
  return Buffer.from(data).toString("base64");
}

// Descifra
export function decryptSeed(b64: string, pass: string): string {
  const raw = Buffer.from(b64, "base64").toString();
  const [p, seed] = raw.split("::");
  if (p !== pass) throw new Error("Invalid password");
  return seed;
}