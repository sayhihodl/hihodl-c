// src/providers/LoadingProvider.tsx
import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
} from "react";
import { LoadingOverlay } from "@/components/LoadingOverlay";

/** Mini store sin deps para rendimiento */
type Listener = () => void;
type State = { count: number }; // reentrante: si 2 cosas cargan a la vez, no se oculta hasta que ambas terminen

const store = {
  state: { count: 0 } as State,
  listeners: new Set<Listener>(),
  set(partial: Partial<State>) {
    store.state = { ...store.state, ...partial };
    store.listeners.forEach((l) => l());
  },
  subscribe(l: Listener) {
    store.listeners.add(l);
    return () => store.listeners.delete(l);
  },
  getSnapshot() {
    return store.state;
  },
  getServerSnapshot() {
    return store.state;
  },
};

type CtxValue = {
  show: () => void;
  hide: () => void;
};

const Ctx = createContext<CtxValue | null>(null);

export function LoadingProvider({ children }: { children: React.ReactNode }) {
  const show = useCallback(() => store.set({ count: store.state.count + 1 }), []);
  const hide = useCallback(
    () => store.set({ count: Math.max(0, store.state.count - 1) }),
    []
  );

  const value = useMemo(() => ({ show, hide }), [show, hide]);
  const state = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getServerSnapshot
  );

  return (
    <Ctx.Provider value={value}>
      {children}
      <LoadingOverlay visible={state.count > 0} />
    </Ctx.Provider>
  );
}

export function useGlobalLoading() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useGlobalLoading must be used within <LoadingProvider>");
  return ctx;
}

/** Helper: ejecuta una promesa mostrando el loader global */
export async function withGlobalLoading<T>(fn: () => Promise<T>): Promise<T> {
  store.set({ count: store.state.count + 1 });
  try {
    return await fn();
  } finally {
    store.set({ count: Math.max(0, store.state.count - 1) });
  }
}