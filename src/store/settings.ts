// store/settings.ts
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

type SettingsState = {
  showBalances: boolean;
  toggleBalances(): void;
  setShowBalances(v: boolean): void;
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      showBalances: true,
      toggleBalances: () => set({ showBalances: !get().showBalances }),
      setShowBalances: (v) => set({ showBalances: v }),
    }),
    {
      name: "hihodl-settings",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);