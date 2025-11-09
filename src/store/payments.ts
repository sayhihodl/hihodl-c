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
  deleteMsg: (id: string) => void;
  remindRequest?: (id: string) => void; // Opcional para compatibilidad
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
      // Notificación local: si parece entrante, dispara recibido
      try {
        const looksIncoming = m.kind === "in" || (m as any).direction === "in" || Boolean(m.meta?.isIncoming);
        if (looksIncoming) {
          // carga dinámica para entornos sin notifications
          // eslint-disable-next-line @typescript-eslint/no-var-requires
          const { notifyPaymentReceived } = require("@/lib/notifications");
          notifyPaymentReceived?.({ amount: m.amount, token: m.tokenId, from: m.toDisplay });
        }
      } catch {}
      return { msgs, byThread: { ...s.byThread, [m.threadId]: ids } };
    }),
  remindRequest: (id: string) => {
    const s = get();
    // Solo marca un timestamp para refrescar UI
    s.updateMsg(id, { ts: Date.now() });
  },
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
  deleteMsg: (id: string) => {
    set((s) => {
      const oldMsg = s.msgs[id];
      if (!oldMsg) return {};
      const { threadId } = oldMsg;
      const msgs = { ...s.msgs };
      delete msgs[id];
      const arr = s.byThread[threadId]?.filter((msgId) => msgId !== id) ?? [];
      return { msgs, byThread: { ...s.byThread, [threadId]: arr } };
    });
  },
}));

