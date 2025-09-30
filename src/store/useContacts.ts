// stores/useContacts.ts
import { create } from "zustand";

export type Chain = "sol" | "evm";

export type UCC = {
  id: string;
  displayName: string;                 // alias local
  isHiHodl: boolean;
  username?: string;                   // @alex
  ens?: string;
  sns?: string;
  addresses?: { sol?: string[]; evm?: string[] };
  preferred?: Partial<Record<Chain, string>>;
  lastUsed?: Partial<Record<Chain, string>>;
  status: "Verified" | "Unverified" | "Upgradable";
  inviteLinkId?: string;
  createdAt: number;
  updatedAt: number;
};

type ContactsState = {
  contacts: UCC[];
  recents: { uccId: string; at: number; chain: Chain; tokenId: string }[];
  upsert: (c: Partial<UCC> & { id?: string }) => string; // devuelve id
  markRecent: (uccId: string, chain: Chain, tokenId: string) => void;
  findByAny: (q: string) => UCC[];
};

/** UUID helper que no rompe en RN si no hay crypto.randomUUID */
const genId = () =>
  (globalThis as any)?.crypto?.randomUUID?.() ??
  `ucc_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

export const useContacts = create<ContactsState>((set, get) => ({
  contacts: [],
  recents: [],

  upsert: (partial) => {
    const id = partial.id ?? genId();
    const now = Date.now();

    set((s) => {
      const idx = s.contacts.findIndex((c) => c.id === id);

      if (idx >= 0) {
        const merged = { ...s.contacts[idx], ...partial, updatedAt: now } as UCC;
        const contacts = [...s.contacts];
        contacts[idx] = merged;
        return { contacts };
      } else {
        const c: UCC = {
          id,
          displayName: partial.displayName ?? "Contact",
          isHiHodl: !!partial.isHiHodl,
          username: partial.username,
          ens: partial.ens,
          sns: partial.sns,
          addresses: partial.addresses ?? {},
          preferred: partial.preferred ?? {},
          lastUsed: partial.lastUsed ?? {},
          status: partial.status ?? "Unverified",
          inviteLinkId: partial.inviteLinkId,
          createdAt: now,
          updatedAt: now,
        };
        return { contacts: [c, ...s.contacts] };
      }
    });

    return id;
  },

  markRecent: (uccId, chain, tokenId) =>
    set((s) => ({
      recents: [
        { uccId, chain, tokenId, at: Date.now() },
        ...s.recents.filter((r) => r.uccId !== uccId),
      ].slice(0, 12),
    })),

  findByAny: (q) => {
    const s = q.trim().toLowerCase();
    const pool = get().contacts;
    if (!s) return pool;

    // type guard: sólo strings no vacíos
    const isNonEmptyString = (v: unknown): v is string =>
      typeof v === "string" && v.length > 0;

    return pool.filter((c) => {
      const hay = [
        c.displayName,
        c.username,
        c.ens,
        c.sns,
        ...(c.addresses?.sol ?? []),
        ...(c.addresses?.evm ?? []),
      ]
        .filter(isNonEmptyString)
        .map((v) => v.toLowerCase());

      return hay.some((v) => v.includes(s));
    });
  },
}));