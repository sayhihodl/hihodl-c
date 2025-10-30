import { create } from "zustand";

export type ThreadMsg =
  | { id: string; kind: "tx"; direction: "out"|"in"; amount: string; token: string; chain: "solana"; status: "pending"|"processed"|"confirmed"|"finalized"|"failed"; signature?: string; createdAt: number; memo?: string; }
  | { id: string; kind: "note"; text: string; createdAt: number };

type Thread = { peer: string; items: ThreadMsg[] };

type State = {
  threads: Record<string, Thread>; // key = alias "@maria"
  upsert: (peer: string, item: ThreadMsg) => void;
  patchStatus: (peer: string, id: string, status: "pending" | "processed" | "confirmed" | "finalized" | "failed") => void;
};

export const useThreads = create<State>((set) => ({
  threads: {},
  upsert: (peer, item) =>
    set((s) => {
      const t = s.threads[peer] ?? { peer, items: [] };
      return { threads: { ...s.threads, [peer]: { ...t, items: [item, ...t.items] } } };
    }),
  patchStatus: (peer, id, status) =>
    set((s) => {
      const t = s.threads[peer];
      if (!t) return s;
      return {
        threads: {
          ...s.threads,
          [peer]: { ...t, items: t.items.map(it => (it.id === id && it.kind === "tx" ? { ...it, status } : it)) },
        },
      };
    }),
}));