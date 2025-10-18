import { create } from "zustand";
import type { ChainKey } from "@/config/sendMatrix";

export type PayMsgKind = "out" | "in" | "request";
export type PayMsgStatus = "pending" | "confirmed" | "failed" | "canceled";

export type PayMsg = {
  id: string;
  threadId: string;
  kind: PayMsgKind;            // <-- acepta "request"
  amount: number;
  tokenId: string;
  chain: ChainKey;
  status: PayMsgStatus;
  txId?: string;
  ts: number;
  toDisplay?: string;
  meta?: Record<string, any>;  // requestId, intent, etc.
};

type PaymentsState = {
  msgs: Record<string, PayMsg>;         // id -> msg
  byThread: Record<string, string[]>;   // threadId -> [msgIds]
  addMsg: (m: PayMsg) => void;
  updateMsg: (id: string, patch: Partial<PayMsg>) => void;
  selectByThread: (threadId: string) => PayMsg[];
};

export const usePaymentsStore = create<PaymentsState>((set, get) => ({
  msgs: {},
  byThread: {},
  addMsg: (m) =>
    set((s) => {
      const msgs = { ...s.msgs, [m.id]: m };
      const prev = s.byThread[m.threadId] ?? [];
      // evita duplicados por si reintentas
      const ids = prev.includes(m.id) ? prev : [...prev, m.id];
      return { msgs, byThread: { ...s.byThread, [m.threadId]: ids } };
    }),
  updateMsg: (id, patch) =>
    set((s) => {
      const current = s.msgs[id];
      if (!current) return {};
      const next: PayMsg = {
        ...current,
        ...patch,
        // <-- mergea meta para conservar requestId u otros campos
        meta: { ...(current.meta ?? {}), ...(patch.meta ?? {}) },
      };
      return { msgs: { ...s.msgs, [id]: next } };
    }),
  selectByThread: (threadId) => {
    const s = get();
    const ids = s.byThread[threadId] ?? [];
    return ids.map((id) => s.msgs[id]).filter(Boolean);
  },
}));