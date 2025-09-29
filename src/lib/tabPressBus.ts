// app/lib/tabPressBus.ts
type Listener = () => void;

const listeners = new Set<Listener>();
export const HOME_TAB_PRESS = "homeTabPress";

export function emitHomeTabPress() {
  for (const fn of Array.from(listeners)) {
    try { fn(); } catch (e) { console.warn("tabPress listener error:", e); }
  }
}

export function onHomeTabPress(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}