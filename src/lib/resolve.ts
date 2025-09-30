// lib/resolve.ts
export type ResolvedTarget =
  | { kind: "sol"; address: string }
  | { kind: "evm"; address: string }
  | { kind: "ens"; name: string; address?: string }
  | { kind: "sns"; name: string; address?: string }
  | { kind: "username"; handle: string }  // @alex
  | { kind: "invite"; contact: { phone?: string; email?: string } }
  | { kind: "unknown" };

const RE_ENS = /^[a-z0-9-]+\.eth$/i;
const RE_SNS = /^[a-z0-9_.-]+\.sol$/i;
const RE_HANDLE = /^@[\w.]{2,32}$/i;
const RE_EVM = /^0x[a-fA-F0-9]{40}$/;
const RE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RE_PHONE = /^\+?\d[\d\s-]{6,}$/;

export function quickDetect(input: string): ResolvedTarget {
  const s = input.trim();
  if (RE_HANDLE.test(s)) return { kind: "username", handle: s };
  if (RE_ENS.test(s)) return { kind: "ens", name: s };
  if (RE_SNS.test(s)) return { kind: "sns", name: s };
  if (RE_EVM.test(s)) return { kind: "evm", address: s.toLowerCase() };
  if (RE_EMAIL.test(s) || RE_PHONE.test(s)) return { kind: "invite", contact: { email: RE_EMAIL.test(s) ? s : undefined, phone: RE_PHONE.test(s) ? s : undefined } };
  // Solana (base58 ~32 bytes): simple heurística
  if (/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(s)) return { kind: "sol", address: s };
  return { kind: "unknown" };
}

// resolvers async (ens/sns/username)
export async function resolveLive(t: ResolvedTarget): Promise<ResolvedTarget> {
  switch (t.kind) {
    case "ens":
      // TODO: hook a tu rpc/provider; si resuelve, devolver con address
      return t; 
    case "sns":
      return t;
    case "username":
      // TODO: fetch a tu resolver: alias -> dirección fresh o payload lógico
      return t;
    default:
      return t;
  }
}