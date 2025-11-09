// src/lib/tabPressBus.ts
import { logger } from "@/utils/logger";

type Listener = () => void;

const listeners = new Set<Listener>();
export const HOME_TAB_PRESS = "homeTabPress";

export function emitHomeTabPress() {
  for (const fn of Array.from(listeners)) {
    try { 
      fn(); 
    } catch (e) { 
      logger.warn("tabPress listener error:", e); 
    }
  }
}

export function onHomeTabPress(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}