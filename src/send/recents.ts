// src/send/recents.ts
import type { RecentItem, ParsedRecipient, ChainKey } from "./types";

const KEY = "hihodl.recents";

export function loadRecents(): RecentItem[] {
  try {
    const s = globalThis.localStorage?.getItem(KEY) ?? "";
    return s ? JSON.parse(s) : [];
  } catch { return []; }
}

export function saveRecents(list: RecentItem[]) {
  try { globalThis.localStorage?.setItem(KEY, JSON.stringify(list.slice(0, 20))); } catch {}
}

export function addRecentFromParsed(p: ParsedRecipient, token?: string, amount?: number) {
  const id = `${p.kind}:${p.toRaw}`;
  const next: RecentItem = {
    id,
    displayName: p.display || p.toRaw,
    type: p.kind,
    raw: p.toRaw,
    lastNetwork: (p.toChain as ChainKey) || p.resolved?.chain,
    lastToken: token,
    lastAmount: amount,
    lastAt: new Date().toISOString(),
    meta: {},
  };
  const cur = loadRecents().filter(r => r.id !== id);
  saveRecents([next, ...cur]);
  return next;
}