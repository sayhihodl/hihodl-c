// src/stores/session.ts
import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

const KEY = 'session.v1';

export type MPCWallet = {
  address: string;
  chains: string[];
  ready: boolean;
};

export type Session = {
  provider: 'google' | 'apple';
  idToken: string | null;
  wallet: MPCWallet | null;
  loggedIn: boolean;
};

type SessionState = {
  session: Session | null;
  ready: boolean;                    // ← ya intentamos hidratar
  setSession: (s: Omit<Session, 'loggedIn'>) => Promise<void>;
  clearSession: () => Promise<void>;
  restoreSession: () => Promise<void>;
  getSessionUnsafe: () => Session | null; // útil fuera de React si lo necesitas
};

export const useSessionStore = create<SessionState>((set, get) => ({
  session: null,
  ready: false,

  setSession: async (s) => {
    const next: Session = { ...s, loggedIn: true };
    set({ session: next });
    try {
      await SecureStore.setItemAsync(KEY, JSON.stringify(next));
    } catch (e) {
      console.warn('SecureStore setItem error', e);
    }
  },

  clearSession: async () => {
    set({ session: null });
    try {
      await SecureStore.deleteItemAsync(KEY);
    } catch (e) {
      console.warn('SecureStore deleteItem error', e);
    }
  },

  restoreSession: async () => {
    try {
      const raw = await SecureStore.getItemAsync(KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Session;
        // sanity checks mínimos
        if (parsed?.loggedIn && parsed?.provider) {
          set({ session: parsed, ready: true });
          return;
        }
      }
    } catch (e) {
      console.warn('SecureStore getItem error', e);
    }
    set({ session: null, ready: true });
  },

  getSessionUnsafe: () => get().session,
}));