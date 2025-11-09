// src/send/parseRecipient.ts
import type { ParsedRecipient, ChainKey } from "./types";

/** util */
const re = {
  alias: /^@[\w._-]{3,}$/,
  phoneLoose: /^\+?[0-9\s-]{7,}$/,
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  iban: /^[A-Z]{2}[0-9]{2}[A-Z0-9]{11,30}$/,
  evm: /^0x[a-fA-F0-9]{40}$/,
  ens: /^[\w-]+\.eth$/i,
  tron: /^T[1-9A-HJ-NP-Za-km-z]{33,34}$/, // base58 empezando por T
  solBase58: /^[1-9A-HJ-NP-Za-km-z]{32,44}$/, // rango razonable
  cardNumber: /^[\d\s-]{13,19}$/, // card number: 13-19 digits, puede tener espacios o guiones
};

// Luhn-like IBAN checksum
function ibanIsValid(iban: string) {
  const s = iban.replace(/\s+/g, "").toUpperCase();
  if (!re.iban.test(s)) return false;
  const moved = s.slice(4) + s.slice(0, 4);
  const expanded = moved.replace(/[A-Z]/g, (ch) => (ch.charCodeAt(0) - 55).toString());
  // mod 97
  let total = "";
  for (let i = 0; i < expanded.length; i++) {
    total += expanded[i];
    const num = parseInt(total, 10);
    if (num > 1e7) total = String(num % 97);
  }
  return parseInt(total, 10) % 97 === 1;
}

function normalizePhoneE164(input: string) {
  const digits = input.replace(/[^\d+]/g, "");
  // si no empieza por +, podríamos aplicar país por defecto en el futuro
  return digits;
}

/** el parser principal */
export function parseRecipient(input: string): ParsedRecipient | null {
  const raw = (input || "").trim();
  if (!raw) return null;

  // URI schemes (qr payloads)
  try {
    if (/^[a-z]+:/.test(raw)) {
      const url = new URL(raw);
      const scheme = url.protocol.replace(":", "");
      if (scheme === "ethereum") {
        const addr = url.pathname;
        if (re.evm.test(addr)) return { kind: "evm", toRaw: raw, resolved: { address: addr, chain: "ethereum" as ChainKey }, toChain: "ethereum" };
      }
      if (scheme === "solana") {
        const addr = url.pathname;
        if (re.solBase58.test(addr)) return { kind: "sol", toRaw: raw, resolved: { address: addr, chain: "solana" }, toChain: "solana" };
      }
      if (scheme === "iban") {
        const v = url.pathname.toUpperCase();
        return ibanIsValid(v) ? { kind: "iban", toRaw: v } : { kind: "iban", toRaw: v, error: "Invalid IBAN" };
      }
      if (scheme === "mailto" && re.email.test(url.pathname)) {
        return { kind: "email", toRaw: url.pathname };
      }
      // otros esquemas en el futuro…
    }
  } catch {}

  // alias HiHODL
  if (re.alias.test(raw)) return { kind: "hihodl", toRaw: raw, toChain: "hihodl" };

  // email
  if (re.email.test(raw)) return { kind: "email", toRaw: raw };

  // phone
  if (re.phoneLoose.test(raw)) return { kind: "phone", toRaw: normalizePhoneE164(raw) };

  // IBAN
  if (re.iban.test(raw.toUpperCase())) {
    return ibanIsValid(raw) ? { kind: "iban", toRaw: raw.toUpperCase() } : { kind: "iban", toRaw: raw.toUpperCase(), error: "Invalid IBAN" };
  }

  // ENS
  if (re.ens.test(raw)) return { kind: "ens", toRaw: raw.toLowerCase() };

  // TRON
  if (re.tron.test(raw)) return { kind: "tron", toRaw: raw, toChain: "tron" };

  // EVM (puede ser ethereum, base, polygon, etc. - el sistema permitirá elegir)
  if (re.evm.test(raw)) return { kind: "evm", toRaw: raw, toChain: "ethereum" }; // default, pero se expande a ["base", "polygon", "ethereum"] en UI

  // SOL
  if (re.solBase58.test(raw)) return { kind: "sol", toRaw: raw, toChain: "solana" };

  // Card number (detecta si tiene 13-19 dígitos, sin letras, y no es un número de teléfono)
  // Solo detectar si no empieza con + (los números de teléfono típicamente empiezan con +)
  const digitsOnly = raw.replace(/[\s-]/g, "");
  if (!raw.startsWith("+") && /^\d{13,19}$/.test(digitsOnly) && re.cardNumber.test(raw)) {
    return { kind: "phone", toRaw: digitsOnly }; // Usamos kind: "phone" como placeholder, puede cambiarse a "card" en el futuro
  }

  return null;
}

/** Helper para detectar si el input es una dirección válida que debería navegar al send flow */
export function isSendableAddress(input: string): boolean {
  const parsed = parseRecipient(input);
  if (!parsed) return false;
  
  // Detecta: wallets (evm, sol, tron), hihodl users, iban, o card numbers
  const isCardNumber = parsed.kind === "phone" && /^\d{13,19}$/.test(input.trim().replace(/[\s-]/g, ""));
  
  return (
    parsed.kind === "evm" ||
    parsed.kind === "sol" ||
    parsed.kind === "tron" ||
    parsed.kind === "hihodl" ||
    parsed.kind === "iban" ||
    isCardNumber
  );
}