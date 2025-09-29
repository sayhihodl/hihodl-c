// src/store/app.store.ts
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

type AppState = {
  hydrated: boolean;
  onboardingDone: boolean;
  setOnboardingDone: (v: boolean) => void;
};

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      hydrated: false,
      onboardingDone: false,
      setOnboardingDone: (v) => set({ onboardingDone: v }),
    }),
    {
      name: "app-storage",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ onboardingDone: s.onboardingDone }),
      onRehydrateStorage: () => () => {
        // se ejecuta una vez al terminar de rehidratar
        useAppStore.setState({ hydrated: true });
      },
      migrate: (state) => state ?? { onboardingDone: false, hydrated: true },
    }
  )
);